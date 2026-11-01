from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import datetime

from app.db.database import get_db
from app.db import models

router = APIRouter()

class FeedbackCreate(BaseModel):
    message_id: int
    rating: str  # helpful, not_helpful
    comment: Optional[str] = None

@router.post("/")
def submit_feedback(data: FeedbackCreate, db: Session = Depends(get_db)):
    """Save farmer/user feedback on agricultural advice."""
    if data.rating not in ["helpful", "not_helpful"]:
        raise HTTPException(status_code=400, detail="Rating must be 'helpful' or 'not_helpful'.")
        
    feedback = models.Feedback(
        message_id=data.message_id,
        rating=data.rating,
        comment=data.comment,
        created_at=datetime.datetime.utcnow()
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    
    return {
        "status": "success",
        "feedback_id": feedback.id,
        "message": "Thank you for helping improve AgriMind recommendations."
    }
