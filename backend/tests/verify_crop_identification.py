import urllib.request
import io
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

BASE_URL = "http://127.0.0.1:3000/api/v1/disease/predict"

def send_image_request(img_bytes, crop_name=None, district="Thanjavur", filename="leaf.jpg"):
    boundary = "----CropIdVerifyTestBoundary"
    parts = []
    
    # File part
    header = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode("utf-8")
    parts.append(header)
    parts.append(img_bytes)
    parts.append(b"\r\n")
    
    # Crop hint (if any)
    if crop_name and crop_name != "Auto":
        parts.append((f'--{boundary}\r\nContent-Disposition: form-data; name="crop_name"\r\n\r\n{crop_name}\r\n').encode("utf-8"))
        
    if district:
        parts.append((f'--{boundary}\r\nContent-Disposition: form-data; name="district"\r\n\r\n{district}\r\n').encode("utf-8"))
        
    parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    body = b"".join(parts)
    
    req = urllib.request.Request(
        BASE_URL,
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.getcode(), json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def create_synthetic_leaf(color=(34, 139, 34), spots=False, spot_color=(139, 69, 19), blur=False):
    img = Image.new("RGB", (256, 256), (240, 240, 240))
    draw = ImageDraw.Draw(img)
    # Draw leaf oval
    draw.ellipse([40, 30, 216, 226], fill=color, outline=(20, 100, 20))
    # Midrib vein
    draw.line([128, 30, 128, 226], fill=(20, 100, 20), width=3)
    # Side veins
    for y in range(60, 200, 30):
        draw.line([128, y, 70, y - 20], fill=(25, 110, 25), width=2)
        draw.line([128, y, 186, y - 20], fill=(25, 110, 25), width=2)
        
    if spots:
        for x, y in [(90, 80), (160, 110), (110, 150), (140, 170)]:
            draw.ellipse([x - 12, y - 12, x + 12, y + 12], fill=spot_color, outline=(255, 255, 0))
            
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(radius=8))
        
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()

def create_non_plant_image():
    # Gray geometric metal box (no foliar colors)
    img = Image.new("RGB", (256, 256), (128, 128, 128))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 200, 200], fill=(70, 70, 70), outline=(200, 200, 200))
    draw.line([50, 50, 200, 200], fill=(255, 0, 0), width=4)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()

def run_tests():
    print("==================================================")
    print("AGRIMIND 2.0: AUTOMATIC CROP IDENTIFICATION TESTS")
    print("==================================================")
    
    test_results = []
    
    # Test 1: Auto-detection on healthy leaf (No crop hint supplied)
    print("\n--- Test 1: Automatic Crop Identification (No User Hint) ---")
    leaf_bytes = create_synthetic_leaf(color=(46, 139, 87), spots=False)
    status, data = send_image_request(leaf_bytes, crop_name="Auto")
    print(f"HTTP Status: {status}")
    print(f"Request ID: {data.get('request_id')}")
    print(f"Auto Crop Detected: {data.get('auto_crop_detected')}")
    print(f"Crop ID Status: {data.get('crop_identification', {}).get('identification_status')}")
    print(f"Method: {data.get('crop_identification', {}).get('method')}")
    print(f"Visual Evidence: {data.get('crop_identification', {}).get('visual_evidence')[:80]}...")
    assert status == 200, f"Expected 200, got {status}"
    assert data.get("request_id") is not None
    assert data.get("crop_name") is not None
    test_results.append(("Auto Crop Identification (No Hint)", "PASS"))

    # Test 2: Diseased Leaf with Spotting
    print("\n--- Test 2: Diseased Leaf (Necrotic Lesions) ---")
    diseased_bytes = create_synthetic_leaf(color=(34, 139, 34), spots=True)
    status2, data2 = send_image_request(diseased_bytes, crop_name="Auto")
    print(f"HTTP Status: {status2}")
    print(f"Request ID: {data2.get('request_id')}")
    print(f"Predicted Disease: {data2.get('predicted_class')}")
    print(f"Target Crop: {data2.get('crop_name')}")
    print(f"Confidence: {data2.get('confidence')}")
    assert status2 == 200
    assert data2.get("request_id") != data.get("request_id"), "Request IDs must be unique per analysis!"
    test_results.append(("Diseased Leaf Identification & Unique Request ID", "PASS"))

    # Test 3: Non-Plant Rejection (Abstention)
    print("\n--- Test 3: Non-Plant Subject (Abstention Check) ---")
    non_plant_bytes = create_non_plant_image()
    status3, data3 = send_image_request(non_plant_bytes, crop_name="Auto")
    print(f"HTTP Status: {status3}")
    print(f"Analysis Status: {data3.get('analysis_status')}")
    print(f"Crop ID Status: {data3.get('crop_identification', {}).get('identification_status')}")
    print(f"Abstain Flag: {data3.get('crop_identification', {}).get('abstain')}")
    print(f"Predicted Class: {data3.get('predicted_class')}")
    assert status3 == 200
    assert data3.get("analysis_status") == "unsupported_non_plant"
    assert data3.get("crop_identification", {}).get("abstain") is True
    test_results.append(("Non-Plant Subject Rejection & Honest Abstention", "PASS"))

    # Test 4: Blurry Plant Image (Soft focus / low clarity)
    print("\n--- Test 4: Blurry Plant Image ---")
    blurry_bytes = create_synthetic_leaf(color=(34, 139, 34), spots=True, blur=True)
    status4, data4 = send_image_request(blurry_bytes, crop_name="Auto")
    print(f"HTTP Status: {status4}")
    print(f"Image Quality Status: {data4.get('image_quality', {}).get('status')}")
    print(f"Is Blurry: {data4.get('image_quality', {}).get('is_blurry')}")
    print(f"Entropy Uncertainty: {data4.get('uncertainty_metrics', {}).get('confidence_band')}")
    assert status4 == 200
    assert data4.get("image_quality", {}).get("is_blurry") is True
    test_results.append(("Blurry Image Detection & Uncertainty Banding", "PASS"))

    # Test 5: Manual Crop Correction: Banana
    print("\n--- Test 5: User Crop Correction -> Banana ---")
    status5, data5 = send_image_request(diseased_bytes, crop_name="Banana")
    print(f"HTTP Status: {status5}")
    print(f"Confirmed Crop: {data5.get('crop_name')}")
    print(f"Pathology Result: {data5.get('predicted_class')}")
    print(f"Crop ID Status: {data5.get('crop_identification', {}).get('identification_status')}")
    assert status5 == 200
    assert "banana" in data5.get("crop_name", "").lower()
    assert "sigatoka" in data5.get("predicted_class", "").lower() or "banana" in data5.get("predicted_class", "").lower()
    test_results.append(("User Crop Override -> Banana Pathology Adaptation", "PASS"))

    # Test 6: Manual Crop Correction: Rice (Paddy)
    print("\n--- Test 6: User Crop Correction -> Rice (Paddy) ---")
    status6, data6 = send_image_request(diseased_bytes, crop_name="Rice (Paddy)")
    print(f"HTTP Status: {status6}")
    print(f"Confirmed Crop: {data6.get('crop_name')}")
    print(f"Pathology Result: {data6.get('predicted_class')}")
    assert status6 == 200
    assert "rice" in data6.get("crop_name", "").lower()
    assert "blast" in data6.get("predicted_class", "").lower() or "rice" in data6.get("predicted_class", "").lower()
    test_results.append(("User Crop Override -> Rice Pathology Adaptation", "PASS"))

    # Test 7: Manual Crop Correction: Tomato
    print("\n--- Test 7: User Crop Correction -> Tomato ---")
    status7, data7 = send_image_request(diseased_bytes, crop_name="Tomato")
    print(f"HTTP Status: {status7}")
    print(f"Confirmed Crop: {data7.get('crop_name')}")
    print(f"Pathology Result: {data7.get('predicted_class')}")
    assert status7 == 200
    assert "tomato" in data7.get("crop_name", "").lower()
    assert "early blight" in data7.get("predicted_class", "").lower() or "tomato" in data7.get("predicted_class", "").lower()
    test_results.append(("User Crop Override -> Tomato Pathology Adaptation", "PASS"))

    # Test 8: Manual Crop Correction: Mango
    print("\n--- Test 8: User Crop Correction -> Mango ---")
    status8, data8 = send_image_request(diseased_bytes, crop_name="Mango")
    print(f"HTTP Status: {status8}")
    print(f"Confirmed Crop: {data8.get('crop_name')}")
    print(f"Pathology Result: {data8.get('predicted_class')}")
    assert status8 == 200
    assert "mango" in data8.get("crop_name", "").lower()
    assert any(term in data8.get("predicted_class", "").lower() for term in ["anthracnose", "powdery mildew", "mango"])
    test_results.append(("User Crop Override -> Mango Pathology Adaptation", "PASS"))

    print("\n==================================================")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("==================================================")
    for name, res in test_results:
        print(f"  [x] {name}: {res}")

if __name__ == "__main__":
    run_tests()
