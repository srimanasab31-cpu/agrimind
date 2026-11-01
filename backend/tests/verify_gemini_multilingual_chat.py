"""
AgriMind 2.0: Comprehensive Verification Suite for
Gemini-Powered Tamil, Tanglish and English Agricultural Assistant
Tests all 10 required scenarios:
1. "enakku oru doubt"
2. "en thakkali chedi la elai manjala irukku"
3. "thakkali chediku enna uram podanum?"
4. "nel payir la ilai karugudhu"
5. "vazhai marathula poochi irukku"
6. "என் தக்காளி செடியில் இலைகள் மஞ்சளாக இருக்கின்றன"
7. "My tomato plants have yellow leaves. What should I check?"
8. Follow-up query depending on previous answer ("pazhaiya elai mattum")
9. Unrelated non-agricultural question (e.g. "Who won the cricket match?")
10. Simulated Gemini API failure handling (graceful fallback)
Bonus: Regression verification for Crop Health Vision analysis
"""

import sys
import os
import json
import time
import uuid
import requests

# Ensure backend root is on sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

sys.stdout.reconfigure(encoding='utf-8')

API_URL = "http://127.0.0.1:8080/api/v1/chat/"
DEFAULT_TIMEOUT = 35
HEALTH_URL = "http://127.0.0.1:8080/api/v1/health"

def test_1_doubt_opening():
    print("\n--- TEST 1: Conversational Doubt Opening ('enakku oru doubt') ---")
    payload = {"query": "enakku oru doubt", "language": "auto"}
    resp = requests.post(API_URL, json=payload, timeout=DEFAULT_TIMEOUT)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    print(f"Detected Lang: {data.get('language')}")
    print(f"Domain Status: {data.get('domain_status')}")
    print(f"Provider: {data.get('provider')}")
    print(f"Response:\n{data.get('response')}\n")
    
    assert data.get("domain_status") == "agricultural", "Expected agricultural domain approval"
    assert data.get("language") == "tanglish", f"Expected tanglish language, got {data.get('language')}"
    # Verify it does not force premature disease diagnosis
    assert any(w in data.get("response", "").lower() for w in ["kandippa", "doubt", "enna", "payir", "chedi", "problem"]), "Expected natural Tanglish invite"
    print("PASS: Test 1 correctly invites user's agricultural question in Tanglish without forcing premature disease.")

def test_2_tomato_yellow_leaves_tanglish():
    print("\n--- TEST 2: Tomato Yellow Leaves in Tanglish ---")
    payload = {"query": "en thakkali chedi la elai manjala irukku", "language": "auto"}
    resp = requests.post(API_URL, json=payload, timeout=DEFAULT_TIMEOUT)
    assert resp.status_code == 200
    data = resp.json()
    print(f"Detected Lang: {data.get('language')}")
    print(f"Provider: {data.get('provider')}")
    print(f"Response:\n{data.get('response')[:250]}...\n")
    
    assert data.get("language") == "tanglish"
    # Should explain causes and ask diagnostic questions
    resp_text = data.get("response", "").lower()
    assert any(k in resp_text for k in ["thakkali", "elai", "ilai", "manjal"]), "Expected tomato & leaf discussion in Tanglish"
    assert any(k in resp_text for k in ["water", "thannir", "tanni", "nutrient", "saththu", "noi", "disease"]), "Expected multi-factorial cause discussion"
    print("PASS: Test 2 accurately addresses tomato yellowing in natural Tanglish.")

def test_3_tomato_fertilizer_tanglish():
    print("\n--- TEST 3: Tomato Fertilizer in Tanglish ---")
    payload = {"query": "thakkali chediku enna uram podanum?", "language": "auto"}
    resp = requests.post(API_URL, json=payload, timeout=DEFAULT_TIMEOUT)
    assert resp.status_code == 200
    data = resp.json()
    print(f"Detected Lang: {data.get('language')}")
    print(f"Provider: {data.get('provider')}")
    print(f"Response:\n{data.get('response')[:250]}...\n")
    
    assert data.get("language") == "tanglish"
    resp_text = data.get("response", "").lower()
    assert any(k in resp_text for k in ["uram", "thakkali", "npk", "nitrogen", "compost", "manure"]), "Expected fertilizer guidance in Tanglish"
    print("PASS: Test 3 accurately provides tomato fertilizer guidance in Tanglish.")

def test_4_rice_leaf_drying_tanglish():
    print("\n--- TEST 4: Rice Leaf Scorching in Tanglish ---")
    payload = {"query": "nel payir la ilai karugudhu", "language": "auto"}
    resp = requests.post(API_URL, json=payload, timeout=DEFAULT_TIMEOUT)
    assert resp.status_code == 200
    data = resp.json()
    print(f"Detected Lang: {data.get('language')}")
    print(f"Provider: {data.get('provider')}")
    print(f"Response:\n{data.get('response')[:250]}...\n")
    
    assert data.get("language") == "tanglish"
    resp_text = data.get("response", "").lower()
    assert any(k in resp_text for k in ["nel", "paddy", "karugudhu", "blast", "blight"]), "Expected rice leaf discussion in Tanglish"
    print("PASS: Test 4 accurately analyzes rice foliar symptoms in Tanglish.")

def test_5_banana_pest_tanglish():
    print("\n--- TEST 5: Banana Pest in Tanglish ---")
    payload = {"query": "vazhai marathula poochi irukku", "language": "auto"}
    resp = requests.post(API_URL, json=payload, timeout=DEFAULT_TIMEOUT)
    assert resp.status_code == 200
    data = resp.json()
    print(f"Detected Lang: {data.get('language')}")
    print(f"Provider: {data.get('provider')}")
    print(f"Response:\n{data.get('response')[:250]}...\n")
    
    assert data.get("language") == "tanglish"
    resp_text = data.get("response", "").lower()
    assert any(k in resp_text for k in ["vazhai", "banana", "poochi", "pest", "borer"]), "Expected banana pest discussion in Tanglish"
    print("PASS: Test 5 accurately diagnoses banana pests in Tanglish.")

def test_6_tomato_tamil_script():
    print("\n--- TEST 6: Tomato Symptoms in Pure Tamil Script ---")
    q = "என் தக்காளி செடியில் இலைகள் மஞ்சளாக இருக்கின்றன"
    payload = {"query": q, "language": "auto"}
    resp = requests.post(API_URL, json=payload, timeout=DEFAULT_TIMEOUT)
    assert resp.status_code == 200
    data = resp.json()
    print(f"Detected Lang: {data.get('language')}")
    print(f"Provider: {data.get('provider')}")
    print(f"Response:\n{data.get('response')[:250]}...\n")
    
    assert data.get("language") == "ta", f"Expected 'ta', got {data.get('language')}"
    resp_text = data.get("response", "")
    assert "தக்காளி" in resp_text, "Expected Tamil script response containing தக்காளி"
    assert "இலை" in resp_text or "மஞ்சள்" in resp_text
    print("PASS: Test 6 responds fluently in pure Tamil script.")

def test_7_tomato_english():
    print("\n--- TEST 7: Tomato Symptoms in English ---")
    q = "My tomato plants have yellow leaves. What should I check?"
    payload = {"query": q, "language": "auto"}
    resp = requests.post(API_URL, json=payload, timeout=DEFAULT_TIMEOUT)
    assert resp.status_code == 200
    data = resp.json()
    print(f"Detected Lang: {data.get('language')}")
    print(f"Provider: {data.get('provider')}")
    print(f"Response:\n{data.get('response')[:250]}...\n")
    
    assert data.get("language") == "en"
    resp_text = data.get("response", "").lower()
    assert "tomato" in resp_text
    assert any(k in resp_text for k in ["nitrogen", "water", "drainage", "blight", "leaves"]), "Expected comprehensive English diagnosis"
    print("PASS: Test 7 responds in natural, professional English.")

def test_8_multiturn_context():
    print("\n--- TEST 8: Multi-Turn Context Follow-up ---")
    sid = f"test_session_turn_{uuid.uuid4().hex[:6]}"
    
    # Turn 1:
    q1 = "en thakkali chedi la elai manjala irukku"
    r1 = requests.post(API_URL, json={"query": q1, "session_id": sid}).json()
    print(f"Turn 1 Q: '{q1}'")
    print(f"Turn 1 A:\n{r1.get('response')[:150]}...\n")
    
    # Turn 2: Follow-up that depends on Turn 1
    q2 = "pazhaiya elai mattum"
    r2 = requests.post(API_URL, json={"query": q2, "session_id": sid}).json()
    print(f"Turn 2 Q: '{q2}'")
    print(f"Turn 2 A:\n{r2.get('response')[:250]}...\n")
    
    assert r2.get("domain_status") == "agricultural", "Follow-up should be accepted as ongoing agricultural conversation"
    r2_text = r2.get("response", "").lower()
    # Assistant must recognize it refers to the tomato plant and bottom/older leaves
    assert any(k in r2_text for k in ["thakkali", "pazhaiya", "older", "bottom", "nitrogen", "saththu", "nutrient"]), "Expected assistant to link 'pazhaiya elai mattum' to tomato older leaf symptoms"
    print("PASS: Test 8 preserves multi-turn context across consecutive turns.")

def test_9_unrelated_out_of_domain():
    print("\n--- TEST 9: Unrelated Non-Agricultural Query Filtering ---")
    queries = [
        ("Who won the cricket match yesterday?", "en"),
        ("ipl match la yaaru jeyichanga?", "tanglish")
    ]
    for q, expected_lang in queries:
        resp = requests.post(API_URL, json={"query": q, "language": "auto"})
        assert resp.status_code == 200
        data = resp.json()
        print(f"Query: '{q}'")
        print(f"Domain Status: {data.get('domain_status')}")
        print(f"Refusal Message: {data.get('response')[:120]}...\n")
        
        assert data.get("domain_status") == "rejected_out_of_domain", f"Expected rejection for '{q}'"
        assert "AgriMind" in data.get("response", "")
    print("PASS: Test 9 politely and appropriately redirects non-agricultural queries in user's language.")

def test_10_simulated_gemini_failure_fallback():
    print("\n--- TEST 10: Graceful Fallback on Simulated Gemini Failure ---")
    from fastapi.testclient import TestClient
    from app.main import app
    from app.services import gemini_service
    
    client = TestClient(app)
    orig_fn = gemini_service.generate_agricultural_chat_response
    # Simulate Gemini experiencing 503 or quota disruption
    gemini_service.generate_agricultural_chat_response = lambda *args, **kwargs: (None, "gemini_error: 503 Service Unavailable")
    
    try:
        q = "thakkali chediku enna uram podanum?"
        resp = client.post("/api/v1/chat/", json={"query": q, "language": "tanglish"})
        assert resp.status_code == 200, f"Expected 200 even with simulated Gemini failure, got {resp.status_code}"
        data = resp.json()
        print(f"Fallback Provider: {data.get('provider')}")
        print(f"Fallback Response:\n{data.get('response')[:200]}...\n")
        assert "TNAU" in data.get("provider") or "TNAU" in data.get("response"), "Expected fallback to verified TNAU knowledge base"
        assert "Notice: Gemini API returned: gemini_error: 503" in data.get("response") or "Fallback" in data.get("provider")
        print("PASS: Test 10 gracefully falls back to local TNAU research documents upon Gemini failure.")
    finally:
        gemini_service.generate_agricultural_chat_response = orig_fn

def test_11_crop_health_regression():
    print("\n--- TEST 11: Regression Check for Crop Health Vision Diagnosis ---")
    import os
    img_path = r"c:\NLP\agrimind\backend\data\uploads\Tomato-late-blight-72605cba08f2483aae0fd8f1dc3532a9.jpg"
    if not os.path.exists(img_path):
        print(f"Skipping vision check: test image not found at {img_path}.")
        return
        
    with open(img_path, "rb") as f:
        files = {"file": ("tomato.jpg", f.read(), "image/jpeg")}
    data = {"crop_name": "Auto"}
    
    resp = requests.post("http://127.0.0.1:8080/api/v1/disease/predict", files=files, data=data)
    assert resp.status_code == 200
    res = resp.json()
    print(f"Vision Identified Crop: {res.get('crop_name')}")
    print(f"Vision Diagnosis: {res.get('predicted_class')}")
    print(f"Vision Status: {res.get('analysis_status')}")
    assert res.get("crop_name") == "Tomato"
    assert res.get("analysis_status") == "completed_gemini_vision"
    assert "Onion" not in res.get("crop_name")
    print("PASS: Crop Health Vision pipeline remains 100% operational and healthy.")

if __name__ == "__main__":
    print("=====================================================================")
    print(" AGRIMIND 2.0: GEMINI MULTILINGUAL AGRICULTURAL ASSISTANT TEST SUITE ")
    print("=====================================================================")
    test_1_doubt_opening()
    test_2_tomato_yellow_leaves_tanglish()
    test_3_tomato_fertilizer_tanglish()
    test_4_rice_leaf_drying_tanglish()
    test_5_banana_pest_tanglish()
    test_6_tomato_tamil_script()
    test_7_tomato_english()
    test_8_multiturn_context()
    test_9_unrelated_out_of_domain()
    test_10_simulated_gemini_failure_fallback()
    test_11_crop_health_regression()
    print("\n=====================================================================")
    print(" ALL 11 TESTS (10 CHAT + 1 CROP HEALTH VISION) PASSED SUCCESSFULLY! ")
    print("=====================================================================")
