import os
import numpy as np
import tritonclient.grpc as grpcclient

def inference(inputs_texts: list[str]) -> list[list[float]]:
    """
    Perform inference on a list of input texts using Triton Inference Server.

    This function connects to a Triton server specified by environment variables 
    and performs inference using a pre-configured model. The input texts are 
    sent to the model, and the embeddings produced by the model are returned.

    Args:
        inputs_texts (list[str]): A list of strings to be used as input for the model.

    Returns:
        list[float]: A list of embeddings produced by the model for the input texts.

    Raises:
        Exception: If there are any issues connecting to the Triton server or during inference.

    Environment Variables:
        - TRITON_URL: The base URL of the Triton Inference Server.
        - TRITON_GRPC_PORT: The gRPC port of the Triton Inference Server.
        - TRITON_MODEL_NAME: The name of the model to be used for inference.
    """
    triton_url = os.getenv("TRITON_URL") + ':8001'
    triton_client = grpcclient.InferenceServerClient(url=triton_url)

    output = grpcclient.InferRequestedOutput(name="EMBEDDINGS")

    input_data = np.array([inputs_texts], dtype=object)
    inputs = grpcclient.InferInput(name="TEXT", shape=input_data.shape, datatype="BYTES")

    inputs.set_data_from_numpy(input_data)

    response = triton_client.infer(
        model_name=os.getenv("TRITON_MODEL_NAME"),
        inputs=[inputs],
        outputs=[output]
    )

    return response.as_numpy("EMBEDDINGS")
