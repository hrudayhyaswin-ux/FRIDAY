import logging
from collections.abc import Generator
from typing import Any

from core.config import settings
from ollama import Client, ResponseError

logger = logging.getLogger(__name__)


class LocalLLMClient:
    def __init__(self):
        self.host = settings.OLLAMA_HOST
        self.client = Client(host=self.host)

    def check_connection(self) -> bool:
        """Check if Ollama service is reachable."""
        try:
            # list() is lightweight enough to check connectivity
            self.client.list()
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Ollama at {self.host}: {e}")
            return False

    def list_models(self) -> list[dict[str, Any]]:
        """List all locally downloaded models in Ollama."""
        try:
            response = self.client.list()
            models = []
            for model in getattr(response, "models", []):
                details = getattr(model, "details", None)
                details_dict = {}
                if details:
                    details_dict = {
                        "parent_model": getattr(details, "parent_model", ""),
                        "format": getattr(details, "format", ""),
                        "family": getattr(details, "family", ""),
                        "families": getattr(details, "families", []),
                        "parameter_size": getattr(details, "parameter_size", ""),
                        "quantization_level": getattr(details, "quantization_level", ""),
                    }
                models.append(
                    {
                        "name": getattr(model, "model", ""),
                        "size": getattr(model, "size", 0),
                        "details": details_dict,
                    }
                )
            return models
        except Exception as e:
            logger.error(f"Error listing Ollama models: {e}")
            return []

    def chat_stream(self, model: str, messages: list[dict[str, str]]) -> Generator[str]:
        """Stream chat tokens from the LLM."""
        try:
            response = self.client.chat(model=model, messages=messages, stream=True)
            for chunk in response:
                content = chunk.get("message", {}).get("content", "")
                if content:
                    yield content
        except ResponseError as e:
            logger.error(f"Ollama response error during streaming: {e}")
            yield f"\n[Ollama Error: {e.error}]"
        except Exception as e:
            logger.error(f"Unexpected error in streaming chat: {e}")
            yield "\n[Connection Error: Could not generate response from Ollama. Make sure Ollama is running.]"

    def chat_generate(self, model: str, messages: list[dict[str, str]]) -> str:
        """Generate a complete chat response synchronously."""
        try:
            response = self.client.chat(model=model, messages=messages, stream=False)
            return response.get("message", {}).get("content", "")
        except ResponseError as e:
            logger.error(f"Ollama response error: {e}")
            return f"Ollama Error: {e.error}"
        except Exception as e:
            logger.error(f"Unexpected error in chat: {e}")
            return "Connection Error: Could not connect to Ollama. Ensure Ollama is running."


# Singleton instance
llm_client = LocalLLMClient()
