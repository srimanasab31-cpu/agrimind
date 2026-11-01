from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class MessageBase(BaseModel):
    role: str
    response_text: str

class MessageCreate(MessageBase):
    conversation_id: int
    original_query: Optional[str] = None
    detected_language: Optional[str] = None
    status: str = "success"

class RetrievedSourceResponse(BaseModel):
    document_title: str
    source_url: Optional[str] = None
    page_number: Optional[int] = None
    similarity_score: float
    text_content: Optional[str] = None

class MessageResponse(MessageBase):
    id: int
    created_at: datetime
    retrieved_sources: Optional[List[RetrievedSourceResponse]] = []

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    session_id: str
    messages: List[MessageResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    query: str
    language: str = "auto"
    session_id: Optional[str] = None
    crop_name: Optional[str] = None
    district: Optional[str] = None
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    message_id: int
    language: str
    sources: List[RetrievedSourceResponse] = []
    status: str = "success"
    request_id: Optional[str] = None
    domain_status: Optional[str] = "agricultural"
    provider: Optional[str] = None

class DocumentUploadResponse(BaseModel):
    document_id: int
    file_name: str
    status: str

class DocumentResponse(BaseModel):
    id: int
    title: str
    source_name: Optional[str]
    file_name: str
    document_type: str
    indexing_status: str
    chunk_count: Optional[int] = 0
    uploaded_at: datetime

    class Config:
        from_attributes = True

class RankedCause(BaseModel):
    name: str
    category: str
    probability_or_confidence: float
    visible_image_evidence: str
    context_evidence: str
    supporting_evidence: str
    alternative_explanations: str
    information_needed: str

class EnglishDiagnosticReport(BaseModel):
    problem_summary: str
    why_occurring: str
    visible_symptoms: str
    environmental_and_soil_effect: str
    differential_diagnosis: str
    what_to_check_next: str
    detected_crop: Optional[str] = None
    plant_condition: Optional[str] = None
    recommended_actions: List[str] = []
    prevention: List[str] = []
    confidence_and_limitations: Optional[str] = None

class TamilDiagnosticReport(BaseModel):
    possible_problem: str
    symptoms: str
    possible_causes: str
    season_and_soil_relation: str
    differential_diagnosis: str
    next_actions: str
    detected_crop: Optional[str] = None
    plant_condition: Optional[str] = None
    recommended_actions: List[str] = []
    prevention: List[str] = []
    confidence_and_limitations: Optional[str] = None

class ActionPlan(BaseModel):
    immediate_checks: List[str] = []
    corrective_measures: List[str] = []
    confirmation: List[str] = []
    follow_up: List[str] = []

class OverallAssessment(BaseModel):
    primary_category: str
    severity: str
    summary: str
    is_multiple_causes: bool = False
    contributing_factors: List[str] = []

class ImagePredictionResponse(BaseModel):
    predicted_class: str
    confidence: float
    top_predictions: List[dict] = []
    status: str = "completed"
    model_version: Optional[str] = "2.0.0"
    recommendation_summary: Optional[str] = None
    sources: List[RetrievedSourceResponse] = []
    
    # Enhanced Plant Health & Gemini Vision Fields
    request_id: Optional[str] = None
    image_status: Optional[str] = "plant_detected"
    analysis_status: Optional[str] = None
    crop_name: Optional[str] = None
    auto_crop_detected: Optional[str] = None
    crop_identification: Optional[dict] = None
    plant_health: Optional[dict] = None
    recommendations: Optional[List[str]] = None
    limitations: Optional[List[str]] = None
    image_quality: Optional[dict] = None
    uncertainty_metrics: Optional[dict] = None
    gradcam_heatmap: Optional[str] = None
    model_status: Optional[dict] = None
    overall_assessment: Optional[OverallAssessment] = None
    ranked_causes: Optional[List[RankedCause]] = None
    english_report: Optional[EnglishDiagnosticReport] = None
    tamil_report: Optional[TamilDiagnosticReport] = None
    action_plan: Optional[ActionPlan] = None
    crop_context: Optional[dict] = None
    
class WeatherRequest(BaseModel):
    location: str
    lat: Optional[float] = None
    lon: Optional[float] = None

class WeatherResponse(BaseModel):
    temperature: Optional[float]
    humidity: Optional[float]
    rainfall: Optional[float]
    wind_speed: Optional[float]
    description: Optional[str]
    provider: str
    status: str
    timestamp: datetime

class TestCaseDefinition(BaseModel):
    test_id: str
    title: str
    description: str
    category: str
    input_type: str
    sample_input: str
    required_dependency: str
    expected_behavior: str

class TestResultResponse(BaseModel):
    id: int
    test_id: str
    category: str
    status: str
    duration_ms: int
    expected_behavior: str
    actual_response: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class TestRunResponse(BaseModel):
    id: int
    run_type: str
    status: str
    created_at: datetime
    results: List[TestResultResponse] = []
    
    class Config:
        from_attributes = True
