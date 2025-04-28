import json
import numpy as np

from collections import defaultdict
from dataclasses import dataclass, field
from json_repair import repair_json
from sklearn.cluster import KMeans
from pydantic import RootModel, model_validator
from typing import Dict, List, Optional, Tuple
from fastapi import Request
from mousse_api.api.utils.prompts import SUMMARY_INSTRUCTION_BATCHED
from mousse_api.api.utils.llm import llm_request, LLMException

class ClusterTitles(RootModel[Dict[str, str]]):

    @model_validator(mode='before')
    @classmethod
    def validate_keys(cls, values):
        for key in values:
            if not isinstance(key, str) or not key.isdigit():
                raise ValueError(f"Key '{key}' is not a digit-only string")
        return values

@dataclass
class ClusterElement:
    text_id: str
    text: str
    score: float = 0.0


@dataclass
class Cluster:
    id: int
    representative_id: str
    representative_text: str
    summary: Optional[str] = None
    elements: List[ClusterElement] = field(default_factory=list)


class ClusterClassifier:
    texts: List[str]
    text_ids: List[int]
    scores: Optional[List[float]]
    projections: np.ndarray

    summarization_endpoint: str

    def __init__(
        self,
        texts: List[str],
        text_ids: List[str],
        projections: np.ndarray,
        request: Request,
        scores: Optional[List[float]] = None,
    ) -> None:
        """
        Initialize the ClusterClassifier.

        Args:
            texts: List of text documents to cluster.
            text_ids: List of IDs for the texts. If None, indices will be used.
            scores: List of scores for the texts. If None, all scores will be set to 0.
            request: FastAPI request object for accessing headers.
            projections: Projected embeddings (e.g., after PCA), shape (n_docs, proj_dim).
        """
        self.summary_instruction = SUMMARY_INSTRUCTION_BATCHED

        self.texts = texts
        self.text_ids = text_ids
        self.scores = scores if scores is not None else [0.0] * len(texts)
        self.projected_embeddings = projections
        self._request = request

    async def fit(
        self,
        n_clusters: int = 8,
    ) -> List[Cluster]:
        """
        Fit the cluster classifier on text data.

        This method performs clustering on the provided embeddings or projections and
        optionally generates summaries for each cluster.

        Args:
            n_clusters: Number of clusters for K-means clustering.

        Returns:
            List of Cluster objects
        """
        cluster_labels, cluster_representatives = self.cluster(
            self.projected_embeddings, n_clusters
        )

        label2docs = defaultdict(list)
        for i, label in enumerate(cluster_labels):
            label2docs[label].append(i)

        cluster_summaries = await self._generate_summaries(
            cluster_labels=cluster_labels, label2docs=label2docs
        )

        clusters = self._create_cluster_objects(
            cluster_labels=cluster_labels,
            cluster_representatives=cluster_representatives,
            cluster_summaries=cluster_summaries,
        )
        return self._sort_clusters(clusters)
    
    def _sort_clusters(
        self, clusters: List[Cluster], sort_by: str = "score"
    ) -> List[Cluster]:
        """
        Sort clusters based on the specified attribute.

        Args:
            clusters: List of Cluster objects to sort.
            sort_by: Attribute to sort by. Can be "score" or "text_id".

        Returns:
            Sorted list of Cluster objects.
        """
        if sort_by == "score":
            return sorted(clusters, key=lambda c: c.elements[0].score, reverse=True)
        elif sort_by == "text_id":
            return sorted(clusters, key=lambda c: c.representative_id)
        else:
            raise ValueError(f"Invalid sort_by value: {sort_by}")

    def cluster(
        self, embeddings: np.ndarray, n_clusters: int
    ) -> Tuple[np.ndarray, Dict[int, int]]:
        """
        Perform K-means clustering on document embeddings.

        Args:
            embeddings: Document embeddings matrix to cluster
            n_clusters: Number of clusters to create

        Returns:
            Tuple containing:
                - cluster labels for each document
                - representative document indices for each cluster
        """

        try:
            clustering = KMeans(
                n_clusters=n_clusters, random_state=42, tol=1e-6, max_iter=1000
            ).fit(embeddings)
        except ValueError:
            clustering = KMeans(
                n_clusters=5, random_state=42, tol=1e-6, max_iter=1000
            ).fit(embeddings)

        labels = clustering.labels_

        representatives = self._find_representatives(labels)

        return labels, representatives

    def _find_representatives(self, labels: np.ndarray) -> Dict[int, int]:
        """
        Find representative documents for each cluster.

        A representative document is the document closest to the centroid of its cluster.

        Args:
            labels: Cluster label for each document

        Returns:
            Dictionary mapping cluster labels to their representative document indices.
        """

        unique_labels = np.unique(labels)
        representatives = {}

        for label in unique_labels:

            cluster_points = self.projected_embeddings[labels == label]
            cluster_indices = np.where(labels == label)[0]  # Indices of points in this cluster

            center = np.mean(cluster_points, axis=0)
            distances = np.linalg.norm(cluster_points - center, axis=1)
            representative_index_in_cluster = np.argmin(distances)

            representatives[label] = cluster_indices[representative_index_in_cluster]

        return representatives

    def _create_cluster_objects(
        self,
        cluster_labels: np.ndarray,
        cluster_representatives: Dict[int, int],
        cluster_summaries: Dict[int, str],
    ) -> List[Cluster]:
        """
        Create Cluster objects from clustering results.

        Returns:
            List of Cluster objects.
        """
        clusters = []
        unique_labels = set(cluster_labels)

        for label in unique_labels:
            # Get indices of texts in this cluster

            cluster_indices = [i for i, l in enumerate(cluster_labels) if l == label]
            rep_idx = cluster_representatives.get(
                label, cluster_indices[0] if cluster_indices else None
            )

            cluster_elements = [
                ClusterElement(
                    text_id=str(self.text_ids[i]),
                    text=self.texts[i],
                    score=self.scores[i],
                )
                for i in cluster_indices
            ]
            cluster_elements.sort(key=lambda element: element.score, reverse=True)

            # Get representative ID and text
            representative_id = (
                str(self.text_ids[rep_idx]) if rep_idx is not None else None
            )
            representative_text = self.texts[rep_idx] if rep_idx is not None else None

            clusters.append(
                Cluster(
                    id=int(label),
                    representative_id=representative_id,
                    representative_text=representative_text,
                    summary=cluster_summaries.get(str(label)),
                    elements=cluster_elements,
                )
            )

        return clusters

    async def _generate_summaries(
        self,
        cluster_labels: np.ndarray,
        label2docs: Optional[Dict[int, List[int]]] = None,
    ) -> Dict[int, str]:
        """
        Generate summaries for clusters in batches.

        Returns:
            Dictionary mapping cluster IDs to their summaries.
        """
        unique_labels = sorted(set(cluster_labels))
        cluster_count = len(unique_labels)
        summary_num_batches = 2
        summary_examples = 10
        summary_chunk_size = 420
        cluster_summaries = {}

        np.random.seed(42)

        # Split clusters into batches
        batches = []
        for i in range(summary_num_batches):
            start_idx = i * cluster_count // summary_num_batches
            end_idx = (i + 1) * cluster_count // summary_num_batches
            batches.append(unique_labels[start_idx:end_idx])

        for batch_idx, batch in enumerate(batches):

            batch_examples = []
            batch_cluster_ids = []

            # Select examples for each cluster in the batch
            for label in batch:
                cluster_indices = label2docs[label]
                selected_indices = np.random.choice(
                    cluster_indices,
                    min(summary_examples, len(cluster_indices)),
                    replace=False,
                ).tolist()

                examples = "\n\n".join(
                    [
                        f"Example {i+1}:\n{self.texts[_id][:summary_chunk_size]}"
                        for i, _id in enumerate(selected_indices)
                    ]
                )

                batch_examples.append(f"CLUSTER {label}:\n{examples}")
                batch_cluster_ids.append(label)

            combined_examples = "\n\n====NEXT CLUSTER====\n\n".join(batch_examples)

            try:
                batch_summaries = await llm_request(
                    query=combined_examples,
                    system_prompt=self.summary_instruction,
                    request=self._request,
                    PydanticModel=ClusterTitles,
                    max_requests=3,
                    max_tokens=1024,
                    temperature=0.6,
                )
                batch_summaries = batch_summaries.model_dump()
            except LLMException as e:
                batch_summaries = {}

            cluster_summaries.update(batch_summaries)

        return cluster_summaries

    def _parse_batched_response(
        self, response: str, cluster_ids: List[int]
    ) -> Dict[int, str]:
        """
        Parse a batched response from the summarization API.

        Args:
            response: Response from the API.
            cluster_ids: List of cluster IDs in the batch.

        Returns:
            Dictionary mapping cluster IDs to their summaries.
        """
        try:
            response_json = json.loads(response)
        except json.JSONDecodeError:
            try:
                repaired_json = repair_json(response)
                response_json = json.loads(repaired_json)
            except Exception as e:
                return {}

        cluster_summaries = {}
        for cluster_id_str, summary in response_json.items():
            try:
                cluster_id = int(cluster_id_str)
                if cluster_id in cluster_ids:
                    cluster_summaries[cluster_id] = summary
            except ValueError:
                continue

        return cluster_summaries
