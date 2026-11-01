import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_disease_models():
    res = client.get("/api/v1/disease/models")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert len(data["models"]) > 0
    assert data["models"][0]["name"].startswith("EfficientNet")

def test_disease_invalid_file_rejection():
    # Attempt to upload a non-image text file
    fake_file = io.BytesIO(b"This is just plain text, not an image.")
    res = client.post(
        "/api/v1/disease/predict",
        files={"file": ("fake_leaf.jpg", fake_file, "text/plain")}
    )
    # Should reject with HTTP 400
    assert res.status_code == 400

def test_weather_fallback():
    res = client.get("/api/v1/weather?location=Coimbatore")
    assert res.status_code == 200
    data = res.json()
    assert data["temperature"] is not None
    assert "provider" in data
    assert data["humidity"] > 0

def test_chat_english():
    res = client.post(
        "/api/v1/chat/",
        json={"query": "How to manage rice blast?", "language": "en", "session_id": "test_session_1"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert len(data["response"]) > 0

def test_chat_tamil():
    res = client.post(
        "/api/v1/chat/",
        json={"query": "நெல் இலைகள் மஞ்சளாக மாறுகின்றன", "language": "ta", "session_id": "test_session_2"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert data["language"] == "ta"

def test_sustainable_guides():
    res = client.get("/api/v1/sustainable/")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    assert len(data["guides"]) > 0
    assert "categories" in data

def test_evaluation_metrics():
    res = client.get("/api/v1/evaluation/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "disease_classification" in data
    assert "accuracy" in data["disease_classification"]
    assert "nlp_and_retrieval" in data

def test_test_lab_cases():
    res = client.get("/api/v1/test-lab/cases")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 12  # 12 required test cases
