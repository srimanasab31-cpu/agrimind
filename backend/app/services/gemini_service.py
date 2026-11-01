"""
AgriMind 2.0: Official Google Gemini Multimodal Integration
Leverages the official `google-genai` SDK for Python.
Provides:
1. Multimodal Vision Analysis (leaf image diagnosis with structured JSON schema)
2. Grounded Conversational Generation (incorporating retrieved TNAU/ICAR evidence)
3. Robust Error & Quota Handling with Honest Fallback Signaling
4. Zero-Leakage Credential Management (API keys strictly on backend)
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

# Load environment variables reliably from backend/.env regardless of working directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=False)

logger = logging.getLogger("agrimind.gemini")

def get_gemini_config() -> Dict[str, Any]:
    """Retrieve Gemini API configuration safely without exposing credentials in logs."""
    if ENV_PATH.exists():
        load_dotenv(dotenv_path=ENV_PATH, override=True)

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    provider = os.getenv("AI_PROVIDER", "gemini").strip().lower()
    
    # Clean model name: if user or env specifies deprecated model, upgrade to active 3.5 flash
    raw_model = os.getenv("AI_MODEL", "gemini-3.5-flash-lite").strip()
    if raw_model in ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite"]:
        model_name = "gemini-3.5-flash-lite"
    else:
        model_name = raw_model or "gemini-3.5-flash-lite"
    
    is_configured = bool(api_key and len(api_key.strip()) > 5 and not api_key.startswith("your_"))
    
    logger.info(f"Gemini configuration checked: configured={is_configured}, model={model_name}, provider={provider}")
    
    return {
        "configured": is_configured,
        "api_key": api_key.strip() if is_configured else None,
        "model_name": model_name,
        "provider": "Google Gemini",
        "provider_code": "gemini"
    }

def analyze_crop_image_with_gemini(
    image_bytes: bytes,
    crop_hint: Optional[str] = None,
    user_context: Optional[str] = None,
    language: str = "en"
) -> Tuple[Optional[Dict[str, Any]], str]:
    """
    Sends leaf image to Google Gemini Vision model for multimodal plant health assessment.
    Returns (structured_findings, status_code).
    """
    cfg = get_gemini_config()
    if not cfg["configured"]:
        return None, "unconfigured"

    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=cfg["api_key"])
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        system_prompt = (
            "You are an expert botanical taxonomist and agricultural plant pathologist specializing in Indian agriculture, "
            "particularly Tamil Nadu field crops and horticultural systems.\n"
            "Analyze the uploaded image with rigorous scientific precision.\n\n"
            "STEP 1: BOTANICAL VERIFICATION (Is this a plant?)\n"
            "Examine whether the photograph actually depicts an agricultural plant, crop, leaf, flower, fruit, stem, or canopy.\n"
            "- If the image shows a person, vehicle, building, electronic device, room interior, animal, screenshot, or unrelated object, "
            "set image_status to 'non_plant', provide a clear non_plant_reason describing the object, and set crop_identification and plant_health to null.\n"
            "- If the image is extremely blurry, out of focus, or dark such that botanical structures cannot be resolved, set image_status to 'plant_uncertain'.\n"
            "- If a plant, crop, or crop part is clearly visible, set image_status to 'plant_detected'.\n\n"
            "STEP 2: AUTOMATIC CROP IDENTIFICATION\n"
            "When image_status is 'plant_detected', identify the specific crop shown. "
            "Do NOT assume or force any default crop. Supported crops include Tomato, Rice (Paddy), Banana, Mango, Chilli, "
            "Cotton, Coconut, Groundnut, Maize, Onion, Millets & Pulses, Sugarcane, Brinjal, Potato, Wheat, or any other identified crop.\n"
            "Detail the visible botanical evidence: leaf lamina shape, margin serration, venation pattern (parallel vs reticulate), "
            "arrangement (simple, pinnate, palmate), surface trichomes/glandular hairs, and stem/fruit structures.\n"
            "If multiple candidate crops are plausible, list alternative candidate crops with their respective confidence scores.\n\n"
            "STEP 3: PLANT HEALTH & PATHOLOGY ASSESSMENT\n"
            "Carefully examine the plant tissue for signs of disease, pest feeding, nutritional disorder, or healthy vitality:\n"
            "- If the plant is HEALTHY with normal green pigmentation, intact lamina, and no active lesions, set is_healthy to true, "
            "condition to 'Healthy Plant', category to 'healthy', severity to 'none', and recommend routine agronomic care (balanced fertilization, "
            "proper irrigation). Do NOT prescribe chemical fungicides or pesticides for healthy plants!\n"
            "- If DISEASED or STRESSED, name the specific condition (e.g., 'Tomato Early Blight (Alternaria solani)', 'Rice Blast (Magnaporthe oryzae)', "
            "'Chilli Leaf Curl Virus', 'Zinc Deficiency', etc.), category ('infectious_disease', 'nutrient_deficiency', 'pest_damage', 'abiotic_stress'), "
            "severity ('low', 'moderate', 'severe'), visible symptoms, alternative causes, and what additional field observations would help verify.\n\n"
            "STEP 4: EVIDENCE-BASED RECOMMENDATIONS\n"
            "Provide actionable immediate cultural/organic steps, preventive practices, and monitoring advice aligned with TNAU/ICAR guidelines.\n\n"
            "STEP 5: COMPREHENSIVE TAMIL TRANSLATION\n"
            "Provide accurate, fluent, regional Tamil translations for all 8 standard agricultural reporting fields.\n\n"
            "Return your evaluation strictly in the following JSON format:\n"
            "{\n"
            '  "image_status": "plant_detected | plant_uncertain | non_plant | invalid_image",\n'
            '  "non_plant_reason": "Description of why this is a non-plant or null",\n'
            '  "crop_identification": {\n'
            '    "name": "Exact crop name (e.g. Tomato, Rice (Paddy), Banana, Mango, Chilli, Cotton, Coconut, Groundnut, Maize, Onion, Millets & Pulses, Sugarcane, Brinjal, Potato, Wheat, or other)",\n'
            '    "status": "identified | probable | uncertain | unsupported",\n'
            '    "confidence": 0.0 to 1.0,\n'
            '    "visual_evidence": ["Point 1 about leaf/stem/fruit morphology", "Point 2"],\n'
            '    "alternative_candidates": [\n'
            '      {"crop": "Candidate name", "confidence": 0.0 to 1.0}\n'
            '    ]\n'
            '  },\n'
            '  "plant_health": {\n'
            '    "is_healthy": true or false,\n'
            '    "condition": "Specific condition or Healthy Plant",\n'
            '    "category": "healthy | infectious_disease | nutrient_deficiency | pest_damage | abiotic_stress | inconclusive",\n'
            '    "severity": "low | moderate | severe | unknown",\n'
            '    "visible_symptoms": ["Lesion shape/color", "Chlorosis pattern"],\n'
            '    "alternative_causes": ["Plausible alternative 1", "Plausible alternative 2"],\n'
            '    "what_additional_info_needed": ["Check underside of leaf", "Soil pH test"]\n'
            '  },\n'
            '  "recommendations": {\n'
            '    "immediate_actions": ["Immediate practical step 1", "Step 2"],\n'
            '    "preventive_actions": ["Prevention 1", "Prevention 2"],\n'
            '    "monitoring": ["Monitoring advice for the next 5-7 days"]\n'
            '  },\n'
            '  "limitations": [\n'
            '    "Visual analysis cannot replace laboratory fungal culturing or microscopic verification."\n'
            '  ],\n'
            '  "tamil_translation": {\n'
            '    "detected_crop": "கண்டறியப்பட்ட பயிர் பெயர் தமிழில் (எ.கா. தக்காளி, நெல், மா, வாழை, மிளகாய், வெங்காயம், கத்தரிக்காய்)",\n'
            '    "plant_condition": "தாவரத்தின் நிலை தமிழில் (எ.கா. ஆரோக்கியமானது, பூஞ்சை நோய் தொற்று, ஊட்டச்சத்து குறைபாடு)",\n'
            '    "possible_problem": "சாத்தியமான நோய் அல்லது பாதிப்பு பெயர் தமிழில்",\n'
            '    "symptoms": "காணக்கூடிய இலை அறிகுறிகளின் விளக்கம் தமிழில்",\n'
            '    "possible_causes": "நோய்க்கான சாத்தியமான காரணங்கள் தமிழில்",\n'
            '    "season_and_soil_relation": "பருவம் மற்றும் மண் தொடர்பு தமிழில்",\n'
            '    "differential_diagnosis": "மாற்று காரணங்கள் மற்றும் சந்தேகங்கள் தமிழில்",\n'
            '    "next_actions": "அடுத்தகட்ட களப் பரிசோதனை நடவடிக்கைகள் தமிழில்",\n'
            '    "recommended_actions": ["பரிந்துரைக்கப்படும் நடவடிக்கை 1", "நடவடிக்கை 2"],\n'
            '    "prevention": ["தடுப்பு முறை 1", "தடுப்பு முறை 2"],\n'
            '    "confidence_and_limitations": "நம்பகத்தன்மை மற்றும் வரம்புகள் விளக்கம் தமிழில்"\n'
            '  }\n'
            "}"
        )
        
        user_prompt = (
            f"Analyze this image. User-provided crop hint: {crop_hint or 'None (Auto-detect)'}. "
            f"Field context: {user_context or 'None'}."
        )
        
        # Candidate models to try in case configured model is not available
        candidate_models = [cfg["model_name"]]
        for fallback in ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"]:
            if fallback not in candidate_models:
                candidate_models.append(fallback)
                
        last_error = None
        for model_candidate in candidate_models:
            try:
                start_time = time.time()
                logger.info(f"Dispatching image to Gemini Vision model: {model_candidate}...")
                
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
                logger.info(f"Gemini Vision response received from {model_candidate} in {duration:.2f}s")
                
                if response and response.text:
                    text = response.text.strip()
                    if text.startswith("```json"):
                        text = text[7:]
                    if text.startswith("```"):
                        text = text[3:]
                    if text.endswith("```"):
                        text = text[:-3]
                    parsed = json.loads(text.strip())
                    return parsed, "success_gemini_vision"
            except Exception as candidate_err:
                candidate_msg = str(candidate_err)
                logger.warning(f"Model {model_candidate} attempt failed: {candidate_msg}")
                last_error = candidate_err
                
                # Fatal auth or quota errors should not simply cycle models
                if any(k in candidate_msg.lower() for k in ["api_key_invalid", "api key not valid", "invalid api key", "401"]):
                    return None, "invalid_api_key"
                if any(k in candidate_msg.lower() for k in ["quota", "429", "resource_exhausted"]):
                    return None, "quota_exceeded"
                # If 503 (high demand) or 404 (model sunset/unavailable), try next model candidate!
                continue
                
        if last_error:
            raise last_error
            
        return None, "empty_gemini_response"
        
    except Exception as e:
        err_msg = str(e)
        logger.error(f"Gemini Vision API error: {err_msg}")
        if any(k in err_msg.lower() for k in ["api_key_invalid", "api key not valid", "invalid api key", "401"]):
            return None, "invalid_api_key"
        elif any(k in err_msg.lower() for k in ["quota", "429", "resource_exhausted"]):
            return None, "quota_exceeded"
        elif "timeout" in err_msg.lower():
            return None, "timeout"
        return None, f"gemini_error: {err_msg}"


def generate_agricultural_chat_response(
    query: str,
    system_instruction: str,
    retrieved_context: Optional[str] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    target_language: str = "en"
) -> Tuple[Optional[str], str]:
    """
    Generates evidence-grounded conversational agricultural response via Gemini API.
    Returns (response_text, status_code).
    """
    cfg = get_gemini_config()
    if not cfg["configured"]:
        return None, "unconfigured"

    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=cfg["api_key"])
        
        prompt_parts = []
        if conversation_history:
            history_lines = []
            for turn in conversation_history[-6:]:
                role = "Farmer" if turn.get("role") == "user" else "AgriMind"
                content = turn.get("content", "").strip()
                if content:
                    history_lines.append(f"{role}: {content}")
            if history_lines:
                prompt_parts.append(
                    "=== PREVIOUS CONVERSATION CONTEXT ===\n" +
                    "\n".join(history_lines) +
                    "\n=== END CONTEXT ===\n"
                    "CRITICAL CONTEXT CONTINUITY RULE: Maintain seamless continuity with the previous turns above. "
                    "If the user's new message is a brief answer, clarification, or follow-up (such as 'pazhaiya elai mattum', 'only bottom leaves', 'yes', or 'dry soil'), "
                    "interpret it directly in the context of the previous crop and symptoms discussed in the turns above."
                )

        if retrieved_context:
            prompt_parts.append(
                "=== OFFICIAL VERIFIED AGRICULTURAL EVIDENCE (TNAU / ICAR) ===\n"
                f"{retrieved_context}\n"
                "=== END EVIDENCE ===\n"
                "Ground your answer in the evidence above. Cite document title and page numbers where applicable.\n"
                "If the evidence does not contain the answer, state so honestly without fabricating."
            )
        else:
            prompt_parts.append(
                "Answer the inquiry factually and helpfully within Tamil Nadu sustainable agriculture agronomy."
            )

        if target_language in ["tanglish", "mixed"]:
            prompt_parts.append(
                "CRITICAL TANGLISH (TAMIL IN ENGLISH LETTERS) LANGUAGE INSTRUCTION:\n"
                "1. The user has written in Tanglish (Tamil language typed using the English/Latin alphabet).\n"
                "2. You MUST reply completely in natural, colloquial, easy-to-understand Tanglish (English letters).\n"
                "3. DO NOT use Tamil script characters (no தமிழ் எழுத்துக்கள்). Keep everything in Latin/English alphabet.\n"
                "4. DO NOT reply in pure English prose.\n"
                "5. Use natural Tamil words in English letters (e.g. 'Thakkali chediyil ilai manjal aaguradhukku pala kaaranangal irukkalam...').\n"
                "6. If the user query is a greeting, doubt, or opening (such as 'enakku oru doubt', 'vanakkam', 'help pannunga', 'oru kelvi kekalama?'), "
                "warmly welcome them in Tanglish and invite them to ask their crop, fertilizer, pest, or irrigation doubt (e.g. 'Kandippa! Enna doubt? Unga payir, chedi, uram, noi, poochi, illa irrigation pathi kelunga. Ungalukku enna problem irukku?').\n"
                "7. For crop symptom queries (e.g., yellowing leaves, pests, stunted growth), explain possible reasons (watering, nutrient deficiency, root health, or disease), "
                "ask focused diagnostic questions (old vs new leaves, soil wetness/dryness, lesions/spots), and invite them to upload a photo to the Crop Health page for image diagnosis."
            )
        elif target_language == "ta":
            prompt_parts.append(
                "CRITICAL TAMIL SCRIPT LANGUAGE INSTRUCTION:\n"
                "1. Respond completely in clear, natural, fluent Tamil script (தமிழ்) using standard agricultural terms.\n"
                "2. Do not leave English paragraphs untranslated.\n"
                "3. If the user is greeting, saying 'வணக்கம்', or asking 'ஒரு கேள்வி கேட்கலாமா?', respond warmly in Tamil script and invite their farming questions."
            )
        else:
            prompt_parts.append(
                "CRITICAL ENGLISH LANGUAGE INSTRUCTION:\n"
                "1. Respond in clear, empathetic, scientifically grounded English tailored for Indian/Tamil Nadu agriculture.\n"
                "2. If the user sent a greeting or conversational opening, warmly welcome them and invite their agricultural questions.\n"
                "3. Distinguish possible causes (nutritional, fungal, water stress) and ask clarifying questions where appropriate."
            )

        prompt_parts.append(f"\nFarmer Question: {query}")
        full_prompt = "\n\n".join(prompt_parts)
        
        chat_models = [cfg["model_name"]]
        for active in ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"]:
            if active not in chat_models:
                chat_models.append(active)
                
        for model_candidate in chat_models:
            try:
                start_time = time.time()
                logger.info(f"Calling Gemini chat model: {model_candidate}...")
                
                response = client.models.generate_content(
                    model=model_candidate,
                    contents=full_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.2
                    )
                )
                duration = time.time() - start_time
                logger.info(f"Gemini chat response received in {duration:.2f}s")
                
                if response and response.text:
                    return response.text.strip(), "success_gemini"
            except Exception as chat_err:
                c_msg = str(chat_err)
                logger.warning(f"Chat model {model_candidate} failed: {c_msg}")
                if any(k in c_msg.lower() for k in ["api_key_invalid", "api key not valid", "401"]):
                    return None, "invalid_api_key"
                if any(k in c_msg.lower() for k in ["quota", "429"]):
                    return None, "quota_exceeded"
                continue
            
        return None, "empty_gemini_response"

    except Exception as e:
        err_msg = str(e)
        logger.error(f"Gemini Chat API error: {err_msg}")
        if "quota" in err_msg.lower() or "429" in err_msg:
            return None, "quota_exceeded"
        elif "authentication" in err_msg.lower() or "api_key" in err_msg.lower() or "401" in err_msg:
            return None, "invalid_api_key"
        elif "timeout" in err_msg.lower():
            return None, "timeout"
        return None, f"gemini_error: {err_msg}"
