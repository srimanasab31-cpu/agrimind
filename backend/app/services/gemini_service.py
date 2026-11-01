"""
AgriMind 2.0 - Google Gemini Integration

Features:
1. Multimodal crop image analysis
2. Structured JSON disease diagnosis
3. Agricultural conversational AI
4. Tamil, Tanglish and English responses
5. TNAU/ICAR evidence integration
6. API key and quota error handling
"""

import os
import io
import time
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from dotenv import load_dotenv
from PIL import Image


# Load backend environment variables.
# Render environment variables will NOT be overwritten.
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BACKEND_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH, override=False)

logger = logging.getLogger("agrimind.gemini")


# --------------------------------------------------
# GEMINI CONFIGURATION
# --------------------------------------------------

def get_gemini_config() -> Dict[str, Any]:

    api_key = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
    )

    provider = os.getenv("AI_PROVIDER", "gemini").strip().lower()

    # Use the model configured in Render.
    raw_model = os.getenv(
        "AI_MODEL",
        "gemini-3.8-flash"
    ).strip()

    model_name = raw_model or "gemini-3.8-flash"

    is_configured = bool(
        api_key
        and len(api_key.strip()) > 5
        and not api_key.startswith("your_")
    )

    logger.info(
        "Gemini configuration checked: configured=%s, model=%s, provider=%s",
        is_configured,
        model_name,
        provider
    )

    return {
        "configured": is_configured,
        "api_key": api_key.strip() if is_configured else None,
        "model_name": model_name,
        "provider": "Google Gemini",
        "provider_code": "gemini"
    }


# --------------------------------------------------
# COMMON ERROR HANDLING
# --------------------------------------------------

def get_error_status(error: Exception) -> str:

    message = str(error).lower()

    if any(word in message for word in [
        "api_key_invalid",
        "api key not valid",
        "invalid api key",
        "authentication",
        "401"
    ]):
        return "invalid_api_key"

    if any(word in message for word in [
        "quota",
        "429",
        "resource_exhausted"
    ]):
        return "quota_exceeded"

    if "timeout" in message or "timed out" in message:
        return "timeout"

    if any(word in message for word in [
        "403",
        "permission_denied",
        "permission denied"
    ]):
        return "permission_denied"

    return "gemini_error"


def get_candidate_models(configured_model: str) -> List[str]:

    # Current stable model first, followed by fallback models.
    models = [
        configured_model,
        "gemini-3.8-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite"
    ]

    unique_models = []

    for model in models:
        if model and model not in unique_models:
            unique_models.append(model)

    return unique_models


# --------------------------------------------------
# CROP IMAGE ANALYSIS
# --------------------------------------------------

def analyze_crop_image_with_gemini(
    image_bytes: bytes,
    crop_hint: Optional[str] = None,
    user_context: Optional[str] = None,
    language: str = "en"
) -> Tuple[Optional[Dict[str, Any]], str]:

    cfg = get_gemini_config()

    if not cfg["configured"]:
        return None, "unconfigured"

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=cfg["api_key"])

        pil_image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

        system_prompt = """
You are an expert agricultural plant pathologist specializing in
Indian agriculture, particularly Tamil Nadu crops.

Analyze the uploaded image carefully.

STEP 1: BOTANICAL VERIFICATION

Determine whether the image contains an agricultural plant,
crop, leaf, flower, fruit, stem or canopy.

If the image shows an unrelated object, person, animal,
vehicle, building or screenshot:

- image_status = non_plant
- Explain non_plant_reason.
- Set crop_identification and plant_health to null.

If the image is too blurry or unclear:

- image_status = plant_uncertain.

If a plant is clearly visible:

- image_status = plant_detected.

STEP 2: CROP IDENTIFICATION

Identify the crop without forcing a default crop.

Possible crops include Tomato, Rice, Banana, Mango, Chilli,
Cotton, Coconut, Groundnut, Maize, Onion, Sugarcane,
Brinjal, Potato, Wheat, Millets and Pulses.

Explain visible botanical evidence such as leaf shape,
margin, venation, colour and stem or fruit structures.

Give alternative crop candidates if necessary.

STEP 3: PLANT HEALTH

Identify whether the plant is healthy or affected by:

- Infectious disease
- Nutrient deficiency
- Pest damage
- Abiotic stress

For healthy plants, do not recommend unnecessary pesticides
or fungicides.

For affected plants, provide the likely condition,
severity, visible symptoms and alternative causes.

STEP 4: RECOMMENDATIONS

Provide practical immediate actions, preventive methods
and monitoring advice based on Indian agricultural practices.

Do not invent scientific certainty. Mention when field
verification is required.

STEP 5: TAMIL TRANSLATION

Provide accurate Tamil translations for the agricultural
reporting fields.

Return ONLY valid JSON in this structure:

{
  "image_status": "plant_detected | plant_uncertain | non_plant | invalid_image",
  "non_plant_reason": null,
  "crop_identification": {
    "name": "Crop name",
    "status": "identified | probable | uncertain | unsupported",
    "confidence": 0.0,
    "visual_evidence": [],
    "alternative_candidates": []
  },
  "plant_health": {
    "is_healthy": true,
    "condition": "Healthy Plant",
    "category": "healthy",
    "severity": "none",
    "visible_symptoms": [],
    "alternative_causes": [],
    "what_additional_info_needed": []
  },
  "recommendations": {
    "immediate_actions": [],
    "preventive_actions": [],
    "monitoring": []
  },
  "limitations": [],
  "tamil_translation": {
    "detected_crop": "",
    "plant_condition": "",
    "possible_problem": "",
    "symptoms": "",
    "possible_causes": "",
    "season_and_soil_relation": "",
    "differential_diagnosis": "",
    "next_actions": "",
    "recommended_actions": [],
    "prevention": [],
    "confidence_and_limitations": ""
  }
}
"""

        user_prompt = (
            f"Analyze this image. "
            f"User-provided crop hint: {crop_hint or 'None (Auto-detect)'}. "
            f"Field context: {user_context or 'None'}. "
            f"Preferred language: {language}."
        )

        candidate_models = get_candidate_models(
            cfg["model_name"]
        )

        last_error = None

        for model_candidate in candidate_models:

            try:
                start_time = time.time()

                logger.info(
                    "Starting crop image analysis using %s",
                    model_candidate
                )

                response = client.models.generate_content(
                    model=model_candidate,
                    contents=[pil_image, user_prompt],
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        response_mime_type="application/json",
                        temperature=0.1
                    )
                )

                duration = time.time() - start_time

                logger.info(
                    "Gemini image response received in %.2f seconds",
                    duration
                )

                if response and response.text:

                    response_text = response.text.strip()

                    if response_text.startswith("```json"):
                        response_text = response_text[7:]

                    elif response_text.startswith("```"):
                        response_text = response_text[3:]

                    if response_text.endswith("```"):
                        response_text = response_text[:-3]

                    parsed_response = json.loads(
                        response_text.strip()
                    )

                    return parsed_response, "success_gemini_vision"

                logger.warning(
                    "Empty image response from model %s",
                    model_candidate
                )

            except Exception as error:

                last_error = error

                logger.exception(
                    "Gemini image model %s failed",
                    model_candidate
                )

                error_status = get_error_status(error)

                if error_status in [
                    "invalid_api_key",
                    "quota_exceeded",
                    "permission_denied"
                ]:
                    return None, error_status

                continue

        if last_error:
            return None, get_error_status(last_error)

        return None, "empty_gemini_response"

    except Exception as error:

        logger.exception("Gemini Vision API error")

        return None, get_error_status(error)


# --------------------------------------------------
# AGRICULTURAL CHAT RESPONSE
# --------------------------------------------------

def generate_agricultural_chat_response(
    query: str,
    system_instruction: str,
    retrieved_context: Optional[str] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    target_language: str = "en"
) -> Tuple[Optional[str], str]:

    cfg = get_gemini_config()

    if not cfg["configured"]:
        return None, "unconfigured"

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=cfg["api_key"])

        prompt_parts = []

        # Conversation history
        if conversation_history:

            history_lines = []

            for turn in conversation_history[-6:]:

                role = (
                    "Farmer"
                    if turn.get("role") == "user"
                    else "AgriMind"
                )

                content = turn.get("content", "").strip()

                if content:
                    history_lines.append(
                        f"{role}: {content}"
                    )

            if history_lines:

                prompt_parts.append(
                    "=== PREVIOUS CONVERSATION CONTEXT ===\n"
                    + "\n".join(history_lines)
                    + "\n=== END CONTEXT ===\n"
                    "Maintain continuity with the previous conversation. "
                    "Interpret short follow-up messages using the earlier "
                    "crop and symptoms discussed."
                )

        # Retrieved agricultural evidence
        if retrieved_context:

            prompt_parts.append(
                "=== OFFICIAL AGRICULTURAL EVIDENCE (TNAU / ICAR) ===\n"
                f"{retrieved_context}\n"
                "=== END EVIDENCE ===\n"
                "Use this evidence to support your answer. "
                "Cite document titles and page numbers where available. "
                "Do not fabricate information if the evidence is insufficient."
            )

        else:

            prompt_parts.append(
                "Answer factually and helpfully within Tamil Nadu "
                "sustainable agriculture."
            )

        # Language instructions
        if target_language in ["tanglish", "mixed"]:

            prompt_parts.append("""
IMPORTANT TANGLISH INSTRUCTIONS:

1. Reply completely in natural Tanglish.
2. Use Tamil words written in English letters.
3. Do not use Tamil script.
4. Avoid pure English paragraphs.
5. Use simple conversational language.
6. For greetings, welcome the farmer warmly.
7. For crop problems, explain possible reasons such as
   watering, nutrient deficiency, root health and disease.
8. Ask focused diagnostic questions.
9. Encourage the farmer to upload a plant image for diagnosis.
""")

        elif target_language == "ta":

            prompt_parts.append("""
IMPORTANT TAMIL INSTRUCTIONS:

1. Reply completely in clear Tamil script.
2. Use natural and understandable agricultural Tamil.
3. Avoid leaving complete English paragraphs untranslated.
4. Welcome the farmer warmly when they greet you.
""")

        else:

            prompt_parts.append("""
IMPORTANT ENGLISH INSTRUCTIONS:

1. Reply in clear and simple English.
2. Be empathetic and scientifically grounded.
3. Focus on Indian and Tamil Nadu agriculture.
4. Explain possible causes such as nutrient deficiency,
   fungal disease and water stress.
5. Ask clarifying questions when required.
""")

        prompt_parts.append(
            f"\nFarmer Question: {query}"
        )

        full_prompt = "\n\n".join(prompt_parts)

        chat_models = get_candidate_models(
            cfg["model_name"]
        )

        last_error = None

        for model_candidate in chat_models:

            try:
                start_time = time.time()

                logger.info(
                    "Calling Gemini chat model: %s",
                    model_candidate
                )

                response = client.models.generate_content(
                    model=model_candidate,
                    contents=full_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.2
                    )
                )

                duration = time.time() - start_time

                logger.info(
                    "Gemini chat response received in %.2f seconds",
                    duration
                )

                if response and response.text:

                    return (
                        response.text.strip(),
                        "success_gemini"
                    )

                logger.warning(
                    "Empty chat response from model %s",
                    model_candidate
                )

            except Exception as error:

                last_error = error

                logger.exception(
                    "Gemini chat model %s failed",
                    model_candidate
                )

                error_status = get_error_status(error)

                if error_status in [
                    "invalid_api_key",
                    "quota_exceeded",
                    "permission_denied"
                ]:
                    return None, error_status

                continue

        if last_error:
            return None, get_error_status(last_error)

        return None, "empty_gemini_response"

    except Exception as error:

        logger.exception("Gemini Chat API error")

        return None, get_error_status(error)
