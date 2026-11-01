from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db import models

router = APIRouter()

@router.get("/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    total_queries = db.query(models.Message).filter(models.Message.role == "user").count()
    images_analyzed = db.query(models.ImagePrediction).count()
    knowledge_docs = db.query(models.Document).count()
    weather_lookups = db.query(models.WeatherRecord).count()
    
    # Query language distribution
    ta_count = db.query(models.Message).filter(
        models.Message.role == "user", 
        models.Message.detected_language == "ta"
    ).count()
    
    en_count = db.query(models.Message).filter(
        models.Message.role == "user", 
        models.Message.detected_language == "en"
    ).count()
    
    return {
        "metrics": {
            "total_queries": total_queries,
            "images_analyzed": images_analyzed,
            "knowledge_docs": knowledge_docs,
            "weather_lookups": weather_lookups
        },
        "language_distribution": {
            "tamil": ta_count,
            "english": en_count
        },
        "recent_activity": []
    }
