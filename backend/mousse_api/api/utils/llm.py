import os
import re
import json
import httpx
import asyncio
import contextlib
from fastapi import Request
from json_repair import repair_json
from pydantic import BaseModel

class ClientDisconnectedError(Exception):
    """Custom exception for client disconnections."""

class JSON_NOT_FOUND(Exception):
    """Raised when the LLM response does not contain a valid JSON"""

class LLMException(Exception):
    """Custom exception for LLM errors."""
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"LLMException {status_code}: {detail}")

async def chat_completion(query: str, system_prompt: str, request: Request, max_tokens: int = 128, temperature: float = 0) -> str:
    url = "{chat_completion_url}/v1/chat/completions".format(
        chat_completion_url=os.getenv("CHAT_COMPLETION_URL")
    )
    model = os.getenv('LLM_MODEL')
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    headers = { 'Content-Type': 'application/json' }

    async with httpx.AsyncClient() as client:
        task = asyncio.create_task(
            client.post(url, headers=headers, json=payload, timeout=120)
        )
        async def monitor_disconnection():
            try:
                while True:
                    message = await request.receive()
                    if message['type'] == 'http.disconnect':
                        break
                task.cancel()
            except asyncio.CancelledError:
                pass
        disconnect_task = asyncio.create_task(monitor_disconnection())

        try:
            response = await task
        except asyncio.CancelledError:
            raise ClientDisconnectedError("Client disconnected before request completion.")
        finally:
            disconnect_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await disconnect_task

        response = response.json()

    try:
        markdown_string = response['choices'][0]['message']['content']
    except (KeyError, IndexError, ValueError, TypeError) as e:
        markdown_string = ""

    return markdown_string

def _extract_json(markdown_string: str) -> str:
    json_match = re.search(r"```json\n(.*?)\n```", markdown_string, re.DOTALL)
    if not json_match:
        raise JSON_NOT_FOUND
    return json_match.group(1)

async def llm_request(query: str, system_prompt: str, request: Request, PydanticModel: BaseModel, max_requests: int = 3, **kwargs):
    """
    Function to handle LLM requests with retries and error handling.
    
    Args:
        query (str): The input query for the LLM.
        system_prompt (str): The system prompt to guide the LLM's response.
        request (Request): The FastAPI request object.
        PydanticModel (BaseModel): The Pydantic model to validate the LLM's response.
        max_requests (int): Maximum number of retries for the request.
        **kwargs: Additional arguments for the chat completion function.
    """
    success = False
    retries = 0
    while not success and retries < max_requests:
        try:
            markdown_string = await chat_completion(query, system_prompt, request, **kwargs)
        except ClientDisconnectedError as e:
            raise LLMException(status_code=400, detail=str(e))
        except RuntimeError as e:
            raise LLMException(status_code=503, detail=str(e))
        try:
            try:
                json_string = _extract_json(markdown_string)
            except JSON_NOT_FOUND:
                safe_json = repair_json(markdown_string)
            else:
                safe_json = repair_json(json_string)
            llm_result = json.loads(safe_json)
            # Handle cases where the LLM returns a list of dictionaries
            # and we want to convert it to a single dictionary
            if isinstance(llm_result, list):
                dict_result = {}
                for item in llm_result:
                    if isinstance(item, dict):
                        dict_result.update(item)
                llm_result = dict_result
            llm_result = PydanticModel(**llm_result)
        except Exception as e:
            retries += 1
        else:
            success = True
    
    if not success:
        raise LLMException(status_code=503, detail="LLM did not return a meaningful response")

    return llm_result
