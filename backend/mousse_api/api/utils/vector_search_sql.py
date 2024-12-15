import json
from datetime import datetime
import shapely
from sqlalchemy import text, TextClause, bindparam, String, Date, Integer, Float
from pgvector.sqlalchemy import Vector

class SqlConstuctor():
    """
    Constructs SQL queries dynamically for filtering records based on various criteria.

    This class uses pre-defined SQL common table expressions (CTEs) to build queries
    that filter records by geographic, temporal, or semantic criteria. The filters
    include country, spatial features, date ranges, epochs, and embeddings.

    Attributes:
        ctes (dict): Pre-defined SQL CTE templates.
        parameters (dict): Parameters to be used in the SQL queries.
        queries (dict): Built SQL queries for various topics.
    """

    ctes = {
        'country': """
            SELECT record_uuid
            FROM core."location"
            WHERE ST_Within(
                ST_MakeValid(geometry),
                (SELECT ST_Simplify(ST_Union(geometry), 0.1) FROM core.countries WHERE "code" IN (%(country_list)s))
            )
        """,
        'features': """
            SELECT record_uuid
            FROM core."location"
            WHERE ST_Within(ST_MakeValid(geometry), ST_GeomFromText(%(wkt)s, 4326))
        """,
        'daterange': """
            SELECT record_uuid
            FROM core.record_time_range
            WHERE time_interval && tstzrange(%(start)s, %(end)s, '[]')
        """,
        'epoch': """
            SELECT record_uuid
            FROM (
                SELECT 
                    record_uuid,
                    CASE 
                        WHEN upper(time_interval) - lower(time_interval) >= '1 year'::interval THEN
                            ARRAY(select generate_series(1, 12))
                        ELSE
                            ARRAY(
                                SELECT EXTRACT(MONTH FROM d)::int
                                FROM generate_series(
                                    lower(time_interval)::date,
                                    upper(time_interval)::date,
                                    '1 month'
                                ) AS d
                            ) 
                    END AS "month"
                FROM core.record_time_range
            ) AS extracted_months
            WHERE array[%(month_list)s] && "month"
        """,
        'semantic': """
            SELECT record_uuid, vector <=> %(embedding)s AS distance
            FROM core.embedding
            WHERE record_uuid IN (SELECT record_uuid FROM ensemble)
            ORDER BY distance
            OFFSET %(offset)d LIMIT %(limit)d
        """,
        'semantic_solo': """
            SELECT record_uuid, vector <=> %(embedding)s AS distance
            FROM core.embedding
            ORDER BY distance
            OFFSET %(offset)d LIMIT %(limit)d
        """,
        'records': """
            SELECT 
                ROUND(1 - emb.distance::numeric, 4) AS score,
                rec.uuid, rec.geoss_id AS original_id, rec.title, rec.description, rec.format, rec.keyword,
                array_agg(topic.topic) AS topic,
                loc.geometry
            FROM vector_search emb
            JOIN core.record rec ON rec."uuid" = emb.record_uuid
            LEFT JOIN core.record_topic bridge ON bridge.record_uuid= emb.record_uuid
            LEFT JOIN core.topic topic ON topic.id = bridge.topic_id
            LEFT JOIN core.location loc ON loc.record_uuid = emb.record_uuid
            WHERE distance < %(maximum_distance)s
            GROUP BY rec."uuid", emb.distance, loc.geometry
            ORDER BY distance
        """
    }

    def __init__(self, page: int = 1, threshold: float = 0.2, results_per_page: int = 10):
        """
        Initializes the SqlConstructor instance.

        Sets up empty dictionaries for storing query parameters and queries.

        Args:
            page (int, optional): The requested page of results. Defaults to 1.
            threshold (float, optional): The similarity score (1 - cosine distance) threshold. Defaults to 0.6.
            results_per_page (int, optional): The number of results per page. Defaults to 10.
        """
        self.parameters = []
        self.queries = {}
        self.page = page
        self.threshold = threshold
        self.results_per_page = results_per_page
    
    def _part(self, topic: str, **kwargs) -> str:
        """
        Retrieves a CTE template and formats it with the given arguments.

        Args:
            topic (str): The topic key to retrieve the corresponding CTE template.
            **kwargs: Named arguments to format the CTE template.

        Returns:
            str: A formatted SQL CTE string.

        Raises:
            ValueError: If the topic is not found in the predefined CTEs.
        """
        if topic not in self.ctes:
            raise ValueError()
        return self.ctes[topic] % kwargs
    
    def add(self, topic: str, *args, **kwargs) -> None:
        """
        Adds a filter CTE for the specified topic.

        Args:
            topic (str): The topic to add the filter for. Supported topics include:
                'country', 'spatial', 'daterange', and 'epoch'.
            *args: Positional arguments specific to the topic.
            **kwargs: Keyword arguments specific to the topic.

        Raises:
            ValueError: If the topic is not supported.
        """
        if topic == 'country':
            self._add_country_cte(*args, **kwargs)
        elif topic == 'spatial':
            self._add_spatial_cte(*args, **kwargs)
        elif topic == 'daterange':
            self._add_daterange_cte(*args, **kwargs)
        elif topic == 'epoch':
            self._add_epoch_cte(*args, **kwargs)
        else:
            raise ValueError()
    
    def _add_country_cte(self, country_list: list[str]) -> None:
        """
        Adds a country filter CTE to the query.

        Args:
            country_list (list[str]): A list of country codes to filter records by.
        """
        for i, country in enumerate(country_list):
            self.parameters.append(bindparam(f"code_{i}", value=country, type_=String))
        placeholders = ", ".join(f":code_{i}" for i in range(len(country_list)))
        self.queries.update({'country_filtered': self._part('country', country_list = placeholders)})

    def _add_spatial_cte(self, features: list) -> None:
        """
        Adds a spatial filter CTE to the query.

        Args:
            features (list): A list of GeoJSON features to define the spatial filter.
        """
        geojson = {
            "type": "FeatureCollection",
            "features": [f.dict() for f in features],
        }
        geojson = json.dumps(geojson)
        wkt = shapely.to_wkt(shapely.union_all(shapely.from_geojson(geojson)))
        self.parameters.append(bindparam("wkt", value=wkt, type_=String))
        self.queries.update({'spatially_filtered': self._part('features', wkt=":wkt")})

    def _add_daterange_cte(self, start_date: str, end_date: str) -> None:
        """
        Adds a date range filter CTE to the query.

        Args:
            start_date (str): The start date in ISO format.
            end_date (str): The end date in ISO format.
        """
        self.parameters.append(bindparam("start_date", value=datetime.strptime(start_date, '%Y-%m-%d').date(), type_=Date))
        self.parameters.append(bindparam("end_date", value=datetime.strptime(end_date, '%Y-%m-%d').date(), type_=Date))
        self.queries.update({'date_filtered': self._part('daterange', start=':start_date', end=':end_date')})

    def _add_epoch_cte(self, months: list[str]) -> None:
        """
        Adds an epoch filter CTE to the query.

        Args:
            months (list[str]): A list of month numbers (as strings) to filter by.
        """
        for i, month in enumerate(months):
            self.parameters.append(bindparam(f"epoch_{i}", value=month, type_=Integer))
        placeholders = ", ".join(f":epoch_{i}" for i in range(len(months)))
        self.queries.update({'epoch_filtered': self._part('epoch', month_list=placeholders)})

    def _add_ensemble_cte(self) -> bool:
        """
        Adds an ensemble CTE by intersecting existing queries.

        Combines all existing queries except 'ensemble' and 'embedding' into an intersection.

        Returns:
            (bool): Returns False if there is no enseble to gather, otherwise True.
        """
        if len(self.queries) == 0:
            return False
        stmts = [f"SELECT record_uuid FROM {cte}" for cte in self.queries if cte not in ['ensemble', 'embedding']]
        self.queries.update({'ensemble': "\nINTERSECT\n".join(stmts)})
        return True

    def _add_embedding_cte(self, embedding: list[float], solo: bool=False) -> None:
        """
        Adds a semantic similarity filter CTE to the query.

        Args:
            embedding (list): A list of embedding values to search for similar records.
            solo (bool, optional): If False, a WHERE statement will be added to apply the filters. Defaults to False.
        """
        cte_part = 'semantic_solo' if solo else 'semantic'
        self.parameters.append(bindparam("embedding", value=embedding, type_=Vector))
        offset = (self.page - 1) * self.results_per_page
        self.queries.update({'vector_search': self._part(cte_part, embedding=':embedding', offset=offset, limit=self.results_per_page + 1)})

    def _add_records_cte(self, maximum_distance: float) -> None:
        cte_part = 'records'
        self.parameters.append(bindparam("maximum_distance", value=maximum_distance, type_=Float))
        self.queries.update({'records': self._part(cte_part, maximum_distance=':maximum_distance')})

    def create(self, embedding: list[float], output: str = 'json') -> TextClause:
        """
        Creates the final SQL query, including all specified filters.

        Args:
            embedding (list): A list of embedding values to search for similar records.

        Returns:
            sqlalchemy.TextClause: A SQLAlchemy TextClause object representing the final query.
        """
        if output != 'json' and output != 'geojson':
            raise ValueError("`output` should be one of `json` or `geojson`")
        solo = not self._add_ensemble_cte()
        self._add_embedding_cte(embedding, solo)
        self._add_records_cte(1 - self.threshold)
        ctes = ",\n".join([f"{name} AS ({stmt})" for name, stmt in self.queries.items()])
        select_stmt = "*" if output == 'json' else "ST_AsGeoJSON(records.*, id_column => 'uuid')"
        stmt = f"""
            WITH {ctes}
            SELECT {select_stmt}
            FROM records
        """.strip()
        return text(stmt).bindparams(*self.parameters)
