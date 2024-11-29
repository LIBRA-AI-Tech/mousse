import os
import json
import torch
import torch.nn.functional as F
from torch import Tensor
from transformers import AutoTokenizer, AutoModel
import triton_python_backend_utils as pb_utils

def read_parameter_as_type(value, name, pytype=str):
    if value == "":
        return None
    if value.startswith("${") and value.endswith("}"):
        value = os.getenv(value[2:-1].upper())
    if pytype is bool:
        return value.lower() in ["1", "true"]
    try:
        result = pytype(value)
        return result
    except:
        pb_utils.Logger.log_warning(
            f"Could not read parameter '{name}' with value '{value}', will use default."
        )
        return None


def get_parameter(model_config, name, default=None, pytype=str):
    if name not in model_config['parameters']:
        return None
    value = read_parameter_as_type(
        model_config['parameters'][name]['string_value'], name, pytype)
    return value if value is not None else default

class TritonPythonModel:

    def initialize(self, args):
        model_config = json.loads(args['model_config'])
        model_engine = "/engines/gte-Qwen2-1.5B-instruct"
        self.tokenizer = AutoTokenizer.from_pretrained(model_engine)
        self.max_length = get_parameter(model_config, "max_length", default=8192, pytype=int)
        self.task_description = get_parameter(model_config, "task_description")
        self.model = AutoModel.from_pretrained(model_engine)
        self.model.eval()

    def last_token_pool(self, last_hidden_states: Tensor, attention_mask: Tensor) -> Tensor:
        left_padding = (attention_mask[:, -1].sum() == attention_mask.shape[0])
        if left_padding:
            return last_hidden_states[:, -1]
        else:
            sequence_lengths = attention_mask.sum(dim=1) - 1
            batch_size = last_hidden_states.shape[0]
            return last_hidden_states[torch.arange(batch_size, device=last_hidden_states.device), sequence_lengths]

    def get_instruct(self, query: str) -> str:
        return f'Instruct: {self.task_description}\nQuery: {query}'

    def execute(self, requests):
        responses = []
        for request in requests:
            input_texts = pb_utils.get_input_tensor_by_name(request, "TEXT").as_numpy()
            input_texts = [self.get_instruct(text[0].decode('utf-8')) for text in input_texts]

            batch_dict = self.tokenizer(
                input_texts,
                max_length=self.max_length,
                padding=True,
                truncation=True,
                return_tensors='pt'
            )

            with torch.no_grad():
                outputs = self.model(**batch_dict)
                embeddings = self.last_token_pool(outputs.last_hidden_state, batch_dict['attention_mask'])
                embeddings = F.normalize(embeddings, p=2, dim=1)
            embeddings_np = embeddings.cpu().numpy()
            embeddings_tensor = pb_utils.Tensor("EMBEDDINGS", embeddings_np)
            responses.append(pb_utils.InferenceResponse(output_tensors=[embeddings_tensor]))
        return responses

    def finalize(self):
        print('Cleaning up...')
        self.model = None
        self.tokenizer = None
