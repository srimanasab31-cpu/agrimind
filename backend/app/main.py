import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend/.env is reliably loaded regardless of working directory
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

app = FastAPI(
    title="AgriMind API",
    description="Backend API for AgriMind - Multimodal AI Assistant for Sustainable Agriculture",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.db.database import engine, SessionLocal
from app.db import models
from app.services.document_service import ensure_default_knowledge_base

models.Base.metadata.create_all(bind=engine)

# Auto-index default knowledge base on startup
@app.on_event("startup")
def startup_event():
    print("AgriMind API started. Knowledge base indexing skipped during startup.")

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to AgriMind API - Multimodal AI Assistant for Sustainable Agriculture"}
