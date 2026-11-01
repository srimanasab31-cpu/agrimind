from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    source_name = Column(String)
    source_url = Column(String, nullable=True)
    file_name = Column(String)
    document_type = Column(String)
    language = Column(String, default="en")
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    indexing_status = Column(String, default="pending") # pending, completed, failed
    error_message = Column(String, nullable=True)
    
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

    @property
    def chunk_count(self):
        return len(self.chunks) if self.chunks else 0

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    chunk_index = Column(Integer)
    page_number = Column(Integer, nullable=True)
    text_content = Column(Text)
    vector_reference = Column(String) # ID in FAISS/Chroma
    
    document = relationship("Document", back_populates="chunks")

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    role = Column(String) # user, assistant
    original_query = Column(Text, nullable=True)
    detected_language = Column(String, nullable=True)
    response_text = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="success") # success, error, insufficient_evidence
    
    conversation = relationship("Conversation", back_populates="messages")
    retrieved_sources = relationship("RetrievedSource", back_populates="message", cascade="all, delete-orphan")

class RetrievedSource(Base):
    __tablename__ = "retrieved_sources"
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    chunk_id = Column(Integer, ForeignKey("document_chunks.id"))
    similarity_score = Column(Float)
    page_number = Column(Integer, nullable=True)
    
    message = relationship("Message", back_populates="retrieved_sources")
    document = relationship("Document")
    chunk = relationship("DocumentChunk")

    @property
    def document_title(self):
        return self.document.title if self.document else "Unknown Document"
        
    @property
    def source_url(self):
        return self.document.source_url if self.document else None
        
    @property
    def text_content(self):
        return self.chunk.text_content if self.chunk else None

class ImagePrediction(Base):
    __tablename__ = "image_predictions"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    crop_name = Column(String, nullable=True)
    predicted_class = Column(String)
    confidence = Column(Float)
    model_name = Column(String)
    model_version = Column(String)
    prediction_status = Column(String) # success, low_confidence, unavailable
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class WeatherRecord(Base):
    __tablename__ = "weather_records"
    id = Column(Integer, primary_key=True, index=True)
    location_label = Column(String, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    weather_data_json = Column(Text)
    provider = Column(String)
    fetched_at = Column(DateTime, default=datetime.datetime.utcnow)

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"))
    rating = Column(String) # helpful, not_helpful
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class TestExecutionRun(Base):
    __tablename__ = "test_execution_runs"
    id = Column(Integer, primary_key=True, index=True)
    run_type = Column(String) # single, suite
    status = Column(String) # in_progress, completed, failed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    results = relationship("TestResult", back_populates="execution_run", cascade="all, delete-orphan")

class TestResult(Base):
    __tablename__ = "test_results"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("test_execution_runs.id"))
    test_id = Column(String, index=True)
    category = Column(String)
    status = Column(String) # PASS, FAIL, BLOCKED, NOT RUN
    duration_ms = Column(Integer, default=0)
    expected_behavior = Column(Text)
    actual_response = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    execution_run = relationship("TestExecutionRun", back_populates="results")

