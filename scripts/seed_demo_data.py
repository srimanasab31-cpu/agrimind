import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db import models
from app.db.database import engine, SessionLocal
import datetime
import random

def seed_data():
    db = SessionLocal()
    
    # Check if data already exists
    if db.query(models.Message).count() > 0:
        print("Data already seeded.")
        return
        
    print("Seeding demo data...")
    
    # Create conversations
    for _ in range(5):
        conv = models.Conversation(session_id=f"demo_session_{random.randint(1000, 9999)}")
        db.add(conv)
        db.commit()
        db.refresh(conv)
        
        # Add messages
        for i in range(random.randint(2, 5)):
            lang = random.choice(["en", "ta"])
            user_msg = models.Message(
                conversation_id=conv.id,
                role="user",
                original_query="Demo query",
                detected_language=lang,
                response_text="Demo query text",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(0, 10))
            )
            db.add(user_msg)
            
            asst_msg = models.Message(
                conversation_id=conv.id,
                role="assistant",
                response_text="Demo response text",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(0, 10))
            )
            db.add(asst_msg)
            
    # Add Image Predictions
    for _ in range(15):
        pred = models.ImagePrediction(
            session_id=f"demo_session_{random.randint(1000, 9999)}",
            crop_name=random.choice(["Tomato", "Rice", "Cotton", "Sugarcane"]),
            predicted_class=random.choice(["Healthy", "Leaf Blight", "Rust", "Powdery Mildew"]),
            confidence=random.uniform(0.7, 0.99),
            model_name="efficientnet_b0",
            model_version="v1.0",
            prediction_status="success",
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(0, 10))
        )
        db.add(pred)
        
    # Add Weather records
    for _ in range(8):
        weather = models.WeatherRecord(
            location_label=random.choice(["Coimbatore", "Madurai", "Tiruchirappalli", "Salem"]),
            weather_data_json="{}",
            provider="Demo Weather Service",
            fetched_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(0, 10))
        )
        db.add(weather)
        
    db.commit()
    db.close()
    print("Demo data seeded successfully.")

if __name__ == "__main__":
    seed_data()
