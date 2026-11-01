import io
import pytest
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_synthetic_leaf(color=(34, 139, 34), spots=False, yellow_margins=False, size=(256, 256)):
    """Generate a realistic test leaf image with optional disease or deficiency symptoms."""
    img = Image.new("RGB", size, (240, 240, 240))
    draw = ImageDraw.Draw(img)
    # Draw leaf blade
    draw.ellipse([40, 20, 216, 236], fill=color, outline=(20, 100, 20))
    
    # Add symptoms
    if spots:
        # Spindle / brown necrotic lesions
        draw.ellipse([80, 80, 110, 140], fill=(139, 69, 19))
        draw.ellipse([140, 110, 170, 160], fill=(101, 67, 33))
        draw.ellipse([100, 160, 130, 200], fill=(139, 69, 19))
    if yellow_margins:
        # Marginal chlorosis / scorch
        draw.arc([40, 20, 216, 236], start=0, end=180, fill=(218, 165, 32), width=15)
        
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf

def test_disease_rice_blast_workflow():
    """Test 1: Rice blast disease diagnosis with symptoms and Delta context."""
    leaf_bytes = create_synthetic_leaf(color=(50, 160, 50), spots=True)
    res = client.post(
        "/api/v1/disease/predict",
        files={"file": ("leaf.jpg", leaf_bytes, "image/jpeg")},
        data={
            "crop_name": "Rice",
            "district": "Thanjavur",
            "season": "Kuruvai",
            "soil_type": "Cauvery Delta Alluvial",
            "growth_stage": "Tillering / Vegetative",
            "symptoms": "Spindle-shaped brown spots on leaf blades with grey center, blast symptoms",
            "irrigation": "Flood / Canal"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert "Rice Blast" in data["predicted_class"]
    assert data["english_report"] is not None
    assert data["tamil_report"] is not None
    assert "நெல்" in data["tamil_report"]["possible_problem"]
    assert len(data["ranked_causes"]) >= 1
    assert len(data["action_plan"]["immediate_checks"]) >= 1
    assert len(data["sources"]) >= 1

def test_nutrient_deficiency_nitrogen():
    """Test 2: Nitrogen deficiency with generalized chlorosis on older leaves."""
    leaf_bytes = create_synthetic_leaf(color=(220, 220, 80))
    res = client.post(
        "/api/v1/disease/predict",
        files={"file": ("nitrogen_leaf.jpg", leaf_bytes, "image/jpeg")},
        data={
            "crop_name": "Rice",
            "district": "Nagapattinam",
            "season": "Kuruvai",
            "growth_stage": "Vegetative",
            "symptoms": "Uniform yellowing starting on older lower leaves, stunting",
            "soil_type": "Coastal sandy"
        }
    )
    assert res.status_code == 200
    data = res.json()
    causes = [c["name"] for c in data["ranked_causes"]]
    assert any("Nitrogen" in c for c in causes)
    assert data["english_report"]["visible_symptoms"] is not None
    assert "தழைச்சத்து" in data["tamil_report"]["possible_problem"] or "Nitrogen" in str(data["tamil_report"])

def test_nutrient_deficiency_potassium():
    """Test 3: Potassium deficiency with leaf margin scorch."""
    leaf_bytes = create_synthetic_leaf(color=(100, 180, 60), yellow_margins=True)
    res = client.post(
        "/api/v1/disease/predict",
        files={"file": ("potassium_leaf.jpg", leaf_bytes, "image/jpeg")},
        data={
            "crop_name": "Tomato",
            "district": "Coimbatore",
            "symptoms": "Marginal chlorosis and leaf edge scorch firing on older leaves"
        }
    )
    assert res.status_code == 200
    data = res.json()
    causes = [c["name"] for c in data["ranked_causes"]]
    assert any("Potassium" in c for c in causes)

def test_waterlogging_stress():
    """Test 4: Waterlogging and root asphyxiation stress."""
    leaf_bytes = create_synthetic_leaf(color=(180, 190, 60))
    res = client.post(
        "/api/v1/disease/predict",
        files={"file": ("waterlogged_leaf.jpg", leaf_bytes, "image/jpeg")},
        data={
            "crop_name": "Cotton",
            "district": "Tiruppur",
            "soil_type": "Black cotton clay",
            "irrigation": "Waterlogged / Stagnant water",
            "symptoms": "Yellowing, waterlogged soil, poor drainage, stunted growth"
        }
    )
    assert res.status_code == 200
    data = res.json()
    causes = [c["name"] for c in data["ranked_causes"]]
    assert any("Waterlogging" in c for c in causes)

def test_pest_damage_sucking_pests():
    """Test 5: Sucking pest and mite injury."""
    leaf_bytes = create_synthetic_leaf(color=(80, 170, 70))
    res = client.post(
        "/api/v1/disease/predict",
        files={"file": ("pest_leaf.jpg", leaf_bytes, "image/jpeg")},
        data={
            "crop_name": "Chilli",
            "district": "Madurai",
            "symptoms": "Severe upward leaf curl, thrips and mites feeding damage"
        }
    )
    assert res.status_code == 200
    data = res.json()
    causes = [c["name"] for c in data["ranked_causes"]]
    assert any("Pest" in c or "Thrip" in c for c in causes)

def test_invalid_image_rejection():
    """Test 6: Reject non-image / corrupted payloads with HTTP 400."""
    res = client.post(
        "/api/v1/disease/predict",
        files={"file": ("fake.txt", io.BytesIO(b"this is text not image"), "text/plain")}
    )
    assert res.status_code == 400
    assert "Unsupported file type" in res.json()["detail"]
