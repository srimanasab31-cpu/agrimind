import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.database import get_db
from app.db import models
from app.services import llm_service, vision_service

router = APIRouter()

@router.get("/")
@router.get("/health")
def check_health(db: Session = Depends(get_db)):
    """
    Comprehensive diagnostic health endpoint reporting verified component statuses.
    """
    # 1. Database check
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        db_ok = False

    # 2. Knowledge Base check
    doc_count = db.query(models.Document).count()
    chunk_count = db.query(models.DocumentChunk).count()
    default_doc = db.query(models.Document).filter(
        models.Document.file_name == "AgriMind_Agriculture_Knowledge_Base.pdf"
    ).first()

    # 3. LLM Provider check
    llm_info = llm_service.get_llm_status()

    # 4. Computer Vision weights check
    vision_info = vision_service.check_weights_availability()

    return {
        "status": "healthy" if db_ok else "degraded",
        "timestamp": os.getenv("APP_ENV", "development"),
        "components": {
            "database": {
                "status": "ok" if db_ok else "error",
                "engine": "SQLite (SQLAlchemy ORM)",
                "conversations": db.query(models.Conversation).count()
            },
            "knowledge_base": {
                "status": "ok" if chunk_count > 0 else "empty",
                "indexed_documents": doc_count,
                "total_chunks": chunk_count,
                "default_pdf_indexed": bool(default_doc and default_doc.indexing_status == "completed")
            },
            "llm_provider": {
                "status": llm_info["status"],
                "provider": llm_info["provider"],
                "model": llm_info["model"],
                "message": llm_info["message"],
                "configured": llm_info["configured"]
            },
            "crop_vision_model": {
                "status": vision_info["status"],
                "model_architecture": vision_info["backbone"],
                "weights_configured": vision_info["weights_configured"],
                "supported_crops_count": vision_info["num_crops"],
                "supported_conditions_count": vision_info["conditions_count"],
                "message": vision_info["message"]
            }
        }
    }
