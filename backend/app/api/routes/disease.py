import os
import io
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from PIL import Image

from app.db.database import get_db
from app.db import models, schemas
from app.services import vision_service, plant_health_engine, gemini_service

router = APIRouter()

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}

@router.get("/config-status")
def get_vision_config_status():
    """Safe configuration status endpoint returning only setup status, never API credentials."""
    cfg = gemini_service.get_gemini_config()
    return {
        "configured": cfg["configured"],
        "provider": cfg["provider"],
        "provider_code": cfg["provider_code"],
        "model_name": cfg["model_name"],
        "vision_active": cfg["configured"],
        "status": "ready" if cfg["configured"] else "unconfigured",
        "message": f"Connected to {cfg['model_name']} via Google Gen AI SDK" if cfg["configured"] else "GEMINI_API_KEY is not configured in backend/.env"
    }

@router.get("/models")
def get_available_models():
    """Return available crop disease classification model metadata, calibration, and classes."""
    info = vision_service.check_weights_availability()
    cfg = gemini_service.get_gemini_config()
    info["gemini_vision_configured"] = cfg["configured"]
    info["gemini_model"] = cfg["model_name"]
    info["gemini_status"] = "ready" if cfg["configured"] else "unconfigured"
    return {
        "models": [info]
    }

@router.post("/predict", response_model=schemas.ImagePredictionResponse)
async def predict_crop_disease(
    file: UploadFile = File(...),
    crop_name: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    season: Optional[str] = Form(None),
    soil_type: Optional[str] = Form(None),
    soil_ph: Optional[float] = Form(None),
    growth_stage: Optional[str] = Form(None),
    symptoms: Optional[str] = Form(None),
    irrigation: Optional[str] = Form(None),
    recent_weather: Optional[str] = Form(None),
    recent_inputs: Optional[str] = Form(None),
    symptom_onset: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    request_id: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    AgriMind 2.0 Multimodal Plant Health Diagnosis:
    1. Validates uploaded leaf image & botanical foliar profiles.
    2. Automatically identifies crop via calibrated temperature-scaled CNN.
    3. Evaluates crop-restricted differential diagnoses with uncertainty scores.
    4. Generates Grad-CAM visual attention heatmap.
    5. Retrieves verified TNAU/ICAR evidence.
    6. Produces structured English and Tamil diagnostic report with unique request ID tracking.
    """
    # 0. Request Tracking ID
    active_req_id = request_id or f"REQ-{uuid.uuid4().hex[:8].upper()}"

    # 1. Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Please upload JPG, PNG, or WEBP images."
        )

    # 2. Read bytes and check size
    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of 10MB ({len(contents) / (1024*1024):.1f}MB)."
        )

    # 3. Verify actual image format via Pillow
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Corrupted or invalid image file. The uploaded file is not a readable image."
        )

    # 4. Save uploaded image to data/uploads
    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    file_path = os.path.join(uploads_dir, f"{active_req_id}_{file.filename or 'leaf.jpg'}")
    try:
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        print(f"Could not persist upload: {e}")

    # 5. Run Hierarchical Plant Health Assessment Engine
    result = plant_health_engine.analyze_plant_health(
        image_bytes=contents,
        crop_name=crop_name,
        district=district,
        season=season,
        soil_type=soil_type,
        soil_ph=soil_ph,
        growth_stage=growth_stage,
        symptoms=symptoms,
        irrigation=irrigation,
        recent_weather=recent_weather,
        recent_inputs=recent_inputs,
        symptom_onset=symptom_onset,
        db=db,
        request_id=active_req_id
    )

    # 6. Record prediction in database
    try:
        prediction_record = models.ImagePrediction(
            session_id=session_id or active_req_id,
            crop_name=result.get("crop_name", "Unknown"),
            predicted_class=result.get("predicted_class", "Uncertain"),
            confidence=result.get("confidence", 0.0),
            model_name=result.get("model_status", {}).get("name", "AgriMind 2.0"),
            model_version=result.get("model_status", {}).get("version", "2.0.0"),
            prediction_status=result.get("status", "completed")
        )
        db.add(prediction_record)
        db.commit()
    except Exception as e:
        print(f"Error persisting image prediction record: {e}")

    return result
