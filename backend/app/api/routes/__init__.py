from fastapi import APIRouter
from . import health, chat, documents, analytics, test_lab, disease, weather, evaluation, feedback, sustainable

router = APIRouter()

router.include_router(health.router, tags=["health"])
router.include_router(chat.router, prefix="/chat", tags=["chat"])
router.include_router(chat.router, prefix="", tags=["conversations"])  # for /conversations
router.include_router(documents.router, prefix="/documents", tags=["documents"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
router.include_router(test_lab.router, prefix="/test-lab", tags=["test_lab"])
router.include_router(disease.router, prefix="/disease", tags=["disease"])
router.include_router(weather.router, prefix="/weather", tags=["weather"])
router.include_router(evaluation.router, prefix="/evaluation", tags=["evaluation"])
router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
router.include_router(sustainable.router, prefix="/sustainable", tags=["sustainable"])

