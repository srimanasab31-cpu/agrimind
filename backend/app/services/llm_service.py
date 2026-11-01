"""
AgriMind 2.0: Unified LLM Routing & Provider Dispatcher
Supports Google Gemini (Primary) and OpenAI (Secondary fallback).
"""

import os
import time
import logging
from typing import Optional, Tuple, List, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

from app.services import gemini_service

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)
logger = logging.getLogger("agrimind.llm")

def get_llm_status() -> Dict[str, Any]:
    """Check configured LLM provider and credentials without exposing secret values."""
    gemini_cfg = gemini_service.get_gemini_config()
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if gemini_cfg["configured"]:
        return {
            "configured": True,
            "provider": "Google Gemini",
            "provider_code": "gemini",
            "model": gemini_cfg["model_name"],
            "status": "ready",
            "message": f"Connected to {gemini_cfg['model_name']} via Google Gen AI SDK"
        }
    elif openai_key and len(openai_key.strip()) > 5 and not openai_key.startswith("your_"):
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        return {
            "configured": True,
            "provider": "OpenAI",
            "provider_code": "openai",
            "model": model,
            "status": "ready",
            "message": f"Connected to {model} via OpenAI API"
        }
    else:
        return {
            "configured": False,
            "provider": "None",
            "provider_code": "none",
            "model": "None",
            "status": "unconfigured",
            "message": "External LLM unconfigured. Calibrated PyTorch vision engine & TNAU RAG synthesis active."
        }

def generate_chat_response(
    query: str,
    system_instruction: str,
    retrieved_context: Optional[str] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    target_language: str = "en"
) -> Tuple[Optional[str], str]:
    """
    Generate response via the configured LLM provider (Gemini or OpenAI).
    Returns (response_text, provider_status).
    """
    status = get_llm_status()
    if not status["configured"]:
        return None, "unconfigured"

    provider = status["provider_code"]
    
    # 1. Google Gemini via gemini_service
    if provider == "gemini":
        return gemini_service.generate_agricultural_chat_response(
            query=query,
            system_instruction=system_instruction,
            retrieved_context=retrieved_context,
            conversation_history=conversation_history,
            target_language=target_language
        )

    # 2. OpenAI via openai SDK
    elif provider == "openai":
        try:
            api_key = os.getenv("OPENAI_API_KEY")
            import openai
            
            client = openai.OpenAI(api_key=api_key)
            model_name = status["model"]
            
            messages = [{"role": "system", "content": system_instruction}]
            if conversation_history:
                for h in conversation_history[-4:]:
                    messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
            
            user_content = query
            if retrieved_context:
                user_content = f"EVIDENCE:\n{retrieved_context}\n\nQUESTION: {query}"
            messages.append({"role": "user", "content": user_content})
            
            start_time = time.time()
            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.2,
                timeout=15.0
            )
            duration = time.time() - start_time
            logger.info(f"OpenAI response in {duration:.2f}s")
            
            text = response.choices[0].message.content
            return text.strip() if text else None, "success_openai"
        except Exception as e:
            logger.error(f"OpenAI error: {e}")
            return None, f"openai_error: {str(e)}"

    return None, "unsupported_provider"
