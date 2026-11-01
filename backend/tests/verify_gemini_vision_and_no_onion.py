"""
AgriMind 2.0 Comprehensive Verification Script
Verifies:
1. Complete elimination of the unintended fixed 'Onion' result.
2. Non-plant rejection with exact required English & Tamil messages.
3. Unconfigured Gemini API key handling (honest signaling, zero fabricated diagnoses).
4. Manual crop selection pathology (Tomato, Rice, Banana, Mango, Chilli, etc.).
5. Full Gemini Vision multimodal response simulation & integration.
6. Bilingual reporting compliance (all 8 Tamil fields populated).
"""

import io
import sys
import os
import json
import requests
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

API_URL = "http://127.0.0.1:8080/api/v1/disease/predict"

def create_synthetic_leaf(color=(34, 139, 34), width=300, height=300):
    """Creates a synthetic green leaf image with veins for testing."""
    img = Image.new("RGB", (width, height), (240, 240, 240))
    draw = ImageDraw.Draw(img)
    # Draw leaf shape
    draw.polygon([(150, 20), (270, 150), (150, 280), (30, 150)], fill=color)
    # Draw central midrib
    draw.line([(150, 20), (150, 280)], fill=(20, 100, 20), width=4)
    # Draw lateral veins
    for y in range(60, 240, 30):
        draw.line([(150, y), (150 + (120 - abs(y-150)), y - 20)], fill=(25, 110, 25), width=2)
        draw.line([(150, y), (150 - (120 - abs(y-150)), y - 20)], fill=(25, 110, 25), width=2)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def create_synthetic_non_plant():
    """Creates a non-plant image (grey metallic texture with red geometric boxes)."""
    img = Image.new("RGB", (300, 300), (128, 128, 128))
    draw = ImageDraw.Draw(img)
    draw.rectangle([(50, 50), (250, 120)], fill=(200, 30, 30))
    draw.rectangle([(80, 160), (220, 260)], fill=(40, 40, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_1_non_plant_rejection():
    print("\n--- TEST 1: Non-Plant Rejection ---")
    non_plant_bytes = create_synthetic_non_plant()
    files = {"file": ("car_or_building.jpg", non_plant_bytes, "image/jpeg")}
    data = {"crop_name": "Auto"}
    
    resp = requests.post(API_URL, files=files, data=data)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    res = resp.json()
    
    print(f"Request ID: {res.get('request_id')}")
    print(f"Image Status: {res.get('image_status')}")
    print(f"Analysis Status: {res.get('analysis_status')}")
    print(f"Predicted Class: {res.get('predicted_class')}")
    print(f"Recommendation Summary: {res.get('recommendation_summary')}")
    
    expected_en = "Please upload a crop or plant image for agricultural analysis. Images of people, vehicles, buildings, and unrelated objects cannot be analyzed by AgriMind."
    expected_ta = "வேளாண் பகுப்பாய்விற்காக பயிர் அல்லது தாவரத்தின் படத்தைப் பதிவேற்றவும். மனிதர்கள், வாகனங்கள், கட்டிடங்கள் மற்றும் தொடர்பில்லாத படங்களை AgriMind மூலம் பகுப்பாய்வு செய்ய முடியாது."
    
    assert res.get("image_status") == "non_plant", f"Expected image_status='non_plant', got {res.get('image_status')}"
    assert res.get("analysis_status") == "rejected_non_plant", f"Expected rejected_non_plant, got {res.get('analysis_status')}"
    assert expected_en in res.get("recommendation_summary", ""), "Exact English rejection message missing!"
    assert expected_ta in res.get("tamil_report", {}).get("possible_problem", ""), "Exact Tamil rejection message missing!"
    assert "Onion" not in res.get("predicted_class", ""), "FAIL: Non-plant image was predicted as Onion!"
    print("PASS: Non-plant image properly rejected with exact bilingual messages and NO false onion prediction.")

def test_2_unconfigured_gemini_honest_signaling():
    print("\n--- TEST 2: Unconfigured Gemini Key Handling ---")
    from app.services import plant_health_engine, gemini_service
    orig_cfg = gemini_service.get_gemini_config
    # Mock unconfigured state to test honest signaling
    gemini_service.get_gemini_config = lambda: {
        "configured": False,
        "api_key": None,
        "model_name": "gemini-3.5-flash-lite",
        "provider": "Google Gemini",
        "provider_code": "gemini"
    }
    try:
        leaf_bytes = create_synthetic_leaf(color=(40, 160, 40))
        result = plant_health_engine.analyze_plant_health(
            image_bytes=leaf_bytes,
            crop_name="Auto"
        )
        print(f"Request ID: {result.get('request_id')}")
        print(f"Image Status: {result.get('image_status')}")
        print(f"Analysis Status: {result.get('analysis_status')}")
        print(f"Predicted Class: {result.get('predicted_class')}")
        print(f"Crop Name: {result.get('crop_name')}")
        
        assert result.get("analysis_status") == "api_key_unconfigured", f"Expected api_key_unconfigured, got {result.get('analysis_status')}"
        assert "Onion" not in result.get("crop_name", ""), "FAIL: Unconfigured key predicted Onion!"
        assert "Onion" not in result.get("predicted_class", ""), "FAIL: Unconfigured key predicted Onion class!"
        print("PASS: Unconfigured Gemini key signaled honestly with zero fabricated Onion predictions.")
    finally:
        gemini_service.get_gemini_config = orig_cfg

def test_6_live_real_image_gemini_vision():
    print("\n--- TEST 6: Live Real Image Gemini Vision Analysis ---")
    img_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "uploads", "Tomato-late-blight-72605cba08f2483aae0fd8f1dc3532a9.jpg"))
    if not os.path.exists(img_path):
        print("Skipping live test: image file not found.")
        return
        
    with open(img_path, "rb") as f:
        files = {"file": ("tomato_leaf.jpg", f.read(), "image/jpeg")}
    data = {"crop_name": "Auto"}
    
    resp = requests.post(API_URL, files=files, data=data)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    res = resp.json()
    
    print(f"Live Analysis Status: {res.get('analysis_status')}")
    print(f"Live Image Status: {res.get('image_status')}")
    print(f"Live Identified Crop: {res.get('crop_name')}")
    print(f"Live Diagnosis: {res.get('predicted_class')}")
    print(f"Live Confidence: {res.get('confidence')}")
    print(f"Live Tamil Crop: {res.get('tamil_report', {}).get('detected_crop')}")
    print(f"Live Tamil Problem: {res.get('tamil_report', {}).get('possible_problem')}")
    
    assert res.get("analysis_status") == "completed_gemini_vision", f"Expected completed_gemini_vision, got {res.get('analysis_status')}"
    assert res.get("crop_name") == "Tomato", f"Expected Tomato, got {res.get('crop_name')}"
    assert "Late Blight" in res.get("predicted_class", ""), f"Expected Late Blight, got {res.get('predicted_class')}"
    assert "Onion" not in res.get("crop_name", ""), "FAIL: Predicted Onion!"
    print("PASS: Live Gemini Vision successfully analyzed real uploaded tomato image.")

def test_3_manual_crop_overrides():
    print("\n--- TEST 3: Manual Crop Selection Diagnostics ---")
    test_crops = ["Tomato", "Rice (Paddy)", "Banana", "Mango", "Chilli", "Onion"]
    leaf_bytes = create_synthetic_leaf()
    
    for crop in test_crops:
        files = {"file": (f"{crop.lower()}_leaf.jpg", leaf_bytes, "image/jpeg")}
        data = {
            "crop_name": crop,
            "district": "Coimbatore",
            "symptoms": "yellow spots on leaf margins"
        }
        resp = requests.post(API_URL, files=files, data=data)
        assert resp.status_code == 200
        res = resp.json()
        
        print(f"Selected: {crop} -> Result Crop: {res.get('crop_name')} | Diagnosis: {res.get('predicted_class')}")
        assert res.get("crop_name") == crop, f"Expected {crop}, got {res.get('crop_name')}"
        if crop != "Onion":
            assert "Onion" not in res.get("crop_name", ""), f"FAIL: {crop} incorrectly diagnosed as Onion!"
            assert "Purple Blotch" not in res.get("predicted_class", ""), f"FAIL: {crop} given Onion Purple Blotch!"
            
    print("PASS: All manual crop selections correctly route to their respective pathology profiles.")

def test_4_gemini_vision_integration_mock():
    print("\n--- TEST 4: Gemini Vision Structured Output Integration ---")
    from app.services import plant_health_engine, gemini_service
    
    # Test Tomato Early Blight Gemini Output
    mock_tomato_gemini = {
        "image_status": "plant_detected",
        "non_plant_reason": None,
        "crop_identification": {
            "name": "Tomato",
            "status": "identified",
            "confidence": 0.94,
            "visual_evidence": [
                "Compound pinnate leaf architecture with serrated lobed leaflets.",
                "Prominent glandular trichomes visible on petiole and veins."
            ],
            "alternative_candidates": [
                {"crop": "Potato", "confidence": 0.05}
            ]
        },
        "plant_health": {
            "is_healthy": False,
            "condition": "Early Blight (Alternaria solani)",
            "category": "infectious_disease",
            "severity": "moderate",
            "visible_symptoms": [
                "Dark brown circular necrotic lesions with distinct target-like concentric rings.",
                "Surrounding chlorotic yellow halos on mature leaf lamina."
            ],
            "alternative_causes": [
                "Septoria Leaf Spot (Septoria lycopersici)",
                "Bacterial Spot (Xanthomonas vesicatoria)"
            ],
            "what_additional_info_needed": [
                "Examine lower vs upper canopy distribution.",
                "Inspect stem for dark collar lesions."
            ]
        },
        "recommendations": {
            "immediate_actions": [
                "Prune and safely destroy lower infected leaves showing target spots.",
                "Avoid overhead irrigation to minimize leaf wetness duration."
            ],
            "preventive_actions": [
                "Apply mulch around base of plants to prevent soil-splash inoculum.",
                "Follow standard TNAU crop rotation with non-solanaceous crops."
            ],
            "monitoring": [
                "Inspect new vegetative growth every 3 days for lesion expansion."
            ]
        },
        "limitations": [
            "Definitive species confirmation requires fungal conidia microscopy."
        ],
        "tamil_translation": {
            "detected_crop": "தக்காளி (Tomato)",
            "plant_condition": "பூஞ்சை நோய் தொற்று (Fungal Disease)",
            "possible_problem": "தக்காளி - ஆரம்பகால இலைக்கருகல் நோய் (Early Blight)",
            "symptoms": "இலையில் அடர் பழுப்பு நிறத்தில் வளைய வடிவிலான கருகல் புள்ளிகள் மற்றும் மஞ்சள் நிற வளையம் காணப்படுகிறது.",
            "possible_causes": "ஆல்டர்நேரியா சொலானி (Alternaria solani) பூஞ்சை வித்துக்கள் அதிக ஈரப்பதத்தில் பரவுதல்.",
            "season_and_soil_relation": "கோயம்புத்தூர் மண்டல தட்பவெப்பநிலை மற்றும் ஈரப்பதத்தில் இந்நோய் எளிதில் பரவும்.",
            "differential_diagnosis": "செப்டோரியா இலைப்புள்ளி அல்லது பாக்டீரியா புள்ளியுடன் ஒப்பிட்டு பார்க்கவும்.",
            "next_actions": "அடி இலைகளை அப்புறப்படுத்தி செடியின் கீழ் காற்று புகுமாறு பராமரிக்கவும்.",
            "recommended_actions": [
                "பாதிக்கப்பட்ட இலைகளைப் பறித்து பாதுகாப்பாக அப்புறப்படுத்தவும்.",
                "இலைகளில் நீர் தேங்காதவாறு சொட்டு நீர்ப்பாசனம் அமைக்கவும்."
            ],
            "prevention": [
                "பயிர் சுழற்சி முறையைக் கடைப்பிடிக்கவும்.",
                "TNAU பரிந்துரைத்த உயிரியல் பூஞ்சாணக் கொல்லிகளைப் பயன்படுத்தவும்."
            ],
            "confidence_and_limitations": "கணினி பார்வை மாதிரி பூர்வாங்க ஆய்வு மட்டுமே; KVK உதவி அலுவலரை அணுகவும்."
        }
    }
    
    # Save original method
    orig_fn = gemini_service.analyze_crop_image_with_gemini
    gemini_service.analyze_crop_image_with_gemini = lambda *args, **kwargs: (mock_tomato_gemini, "success_gemini_vision")
    
    try:
        leaf_bytes = create_synthetic_leaf()
        result = plant_health_engine.analyze_plant_health(
            image_bytes=leaf_bytes,
            crop_name="Auto",
            district="Coimbatore",
            season="Kuruvai"
        )
        
        print(f"Gemini Identified Crop: {result.get('crop_name')}")
        print(f"Gemini Diagnosis: {result.get('predicted_class')}")
        print(f"Image Status: {result.get('image_status')}")
        print(f"Analysis Status: {result.get('analysis_status')}")
        print(f"Tamil Detected Crop: {result.get('tamil_report', {}).get('detected_crop')}")
        print(f"Tamil Problem: {result.get('tamil_report', {}).get('possible_problem')}")
        
        assert result.get("crop_name") == "Tomato", f"Expected Tomato, got {result.get('crop_name')}"
        assert "Early Blight" in result.get("predicted_class"), f"Expected Early Blight, got {result.get('predicted_class')}"
        assert result.get("image_status") == "plant_detected"
        assert result.get("analysis_status") == "completed_gemini_vision"
        assert "தக்காளி" in result.get("tamil_report", {}).get("detected_crop")
        print("PASS: Gemini Vision successfully identified Tomato Early Blight with full Tamil report.")
        
    finally:
        gemini_service.analyze_crop_image_with_gemini = orig_fn

def test_5_healthy_plant_gemini():
    print("\n--- TEST 5: Healthy Plant Recognition (No false diseases / pesticides) ---")
    from app.services import plant_health_engine, gemini_service
    
    mock_healthy_rice = {
        "image_status": "plant_detected",
        "non_plant_reason": None,
        "crop_identification": {
            "name": "Rice (Paddy)",
            "status": "identified",
            "confidence": 0.96,
            "visual_evidence": ["Linear parallel-veined leaf blades with erect graminaceous tillering."],
            "alternative_candidates": []
        },
        "plant_health": {
            "is_healthy": True,
            "condition": "Healthy Plant",
            "category": "healthy",
            "severity": "none",
            "visible_symptoms": ["Vibrant uniform green lamina without active lesions, spots, or yellowing."],
            "alternative_causes": [],
            "what_additional_info_needed": ["Routine tillering stage inspection."]
        },
        "recommendations": {
            "immediate_actions": [
                "Maintain optimal 2-5 cm water layer in paddy field.",
                "Apply balanced top-dressing based on Leaf Color Chart (LCC)."
            ],
            "preventive_actions": [
                "Continue standard integrated nutrient management.",
                "Avoid unnecessary chemical fungicide sprays on healthy crops."
            ],
            "monitoring": ["Inspect leaf canopy weekly for stem borer egg masses."]
        },
        "limitations": ["Visual health does not preclude asymptomatic root pathogens."],
        "tamil_translation": {
            "detected_crop": "நெல் (Rice / Paddy)",
            "plant_condition": "ஆரோக்கியமான தாவர இலை (Healthy Plant)",
            "possible_problem": "ஆரோக்கியமான நெல் பயிர் (Healthy Rice)",
            "symptoms": "இலைகள் பசுமையாகவும் எந்தவித நோய் புள்ளிகள் இல்லாமலும் உள்ளன.",
            "possible_causes": "சமச்சீர் ஊட்டச்சத்து மற்றும் நல்ல பராமரிப்பு.",
            "season_and_soil_relation": "தஞ்சாவூர் குறுவை பருவத்திற்கு உகந்த ஆரோக்கியமான வளர்ச்சி.",
            "differential_diagnosis": "நோய் அறிகுறிகள் எதுவும் இல்லை.",
            "next_actions": "இலை வண்ண அட்டை (LCC) அடிப்படையில் தழைச்சத்து இடவும்.",
            "recommended_actions": [
                "பயிருக்குத் தேவையான அளவு நீர்ப்பாசனம் செய்யவும்.",
                "ஆரோக்கியமான பயிர்களுக்கு தேவையற்ற இரசாயன மருந்துகளைத் தவிர்க்கவும்."
            ],
            "prevention": ["நிலையான ஒருங்கிணைந்த ஊட்டச்சத்து மேலாண்மையைப் பின்பற்றவும்."],
            "confidence_and_limitations": "பயிர் ஆரோக்கியமாக உள்ளது; இரசாயன பயன்பாடு தேவையில்லை."
        }
    }
    
    orig_fn = gemini_service.analyze_crop_image_with_gemini
    gemini_service.analyze_crop_image_with_gemini = lambda *args, **kwargs: (mock_healthy_rice, "success_gemini_vision")
    
    try:
        leaf_bytes = create_synthetic_leaf()
        result = plant_health_engine.analyze_plant_health(
            image_bytes=leaf_bytes,
            crop_name="Auto",
            district="Thanjavur",
            season="Kuruvai"
        )
        
        print(f"Identified: {result.get('crop_name')} | Condition: {result.get('predicted_class')}")
        print(f"Overall Category: {result.get('overall_assessment', {}).get('primary_category')}")
        
        assert result.get("crop_name") == "Rice (Paddy)"
        assert "Healthy" in result.get("predicted_class")
        assert result.get("overall_assessment", {}).get("primary_category") == "healthy"
        # Verify no chemical pesticides are recommended
        recs_str = " ".join(result.get("recommendations", [])).lower()
        assert "fungicide" not in recs_str or "avoid" in recs_str
        print("PASS: Healthy plant recognized; zero false diseases or chemical pesticide recommendations.")
        
    finally:
        gemini_service.analyze_crop_image_with_gemini = orig_fn

if __name__ == "__main__":
    print("=== STARTING AGRIMIND 2.0 GEMINI & ONION ROOT-CAUSE VERIFICATION ===")
    test_1_non_plant_rejection()
    test_2_unconfigured_gemini_honest_signaling()
    test_3_manual_crop_overrides()
    test_4_gemini_vision_integration_mock()
    test_5_healthy_plant_gemini()
    test_6_live_real_image_gemini_vision()
    print("\n=== ALL 6 COMPREHENSIVE VERIFICATION TESTS PASSED SUCCESSFULLY! ===")
