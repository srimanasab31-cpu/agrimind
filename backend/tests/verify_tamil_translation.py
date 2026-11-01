import urllib.request
import json
import sys
import io
from PIL import Image, ImageDraw

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8080/api/v1/disease/predict"

def send_image_request(img_bytes, crop_name=None, district="Thanjavur", season="Kuruvai"):
    boundary = "----TamilVerifyBoundary987"
    parts = []
    
    # File part
    header = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="test_leaf.jpg"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode("utf-8")
    parts.append(header)
    parts.append(img_bytes)
    parts.append(b"\r\n")
    
    if crop_name and crop_name != "Auto":
        parts.append((f'--{boundary}\r\nContent-Disposition: form-data; name="crop_name"\r\n\r\n{crop_name}\r\n').encode("utf-8"))
        
    if district:
        parts.append((f'--{boundary}\r\nContent-Disposition: form-data; name="district"\r\n\r\n{district}\r\n').encode("utf-8"))
        
    if season:
        parts.append((f'--{boundary}\r\nContent-Disposition: form-data; name="season"\r\n\r\n{season}\r\n').encode("utf-8"))
        
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

def create_synthetic_leaf(color=(34, 139, 34), spots=True):
    img = Image.new("RGB", (256, 256), (245, 245, 245))
    draw = ImageDraw.Draw(img)
    draw.ellipse([40, 30, 216, 226], fill=color, outline=(20, 100, 20))
    draw.line([128, 30, 128, 226], fill=(20, 100, 20), width=3)
    for y in range(60, 200, 30):
        draw.line([128, y, 70, y - 20], fill=(25, 110, 25), width=2)
        draw.line([128, y, 186, y - 20], fill=(25, 110, 25), width=2)
    if spots:
        for x, y in [(90, 80), (160, 110), (110, 150), (140, 170)]:
            draw.ellipse([x - 12, y - 12, x + 12, y + 12], fill=(139, 69, 19), outline=(255, 255, 0))
    import io
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def create_non_plant_image():
    img = Image.new("RGB", (256, 256), (50, 50, 50))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 200, 200], fill=(200, 200, 200), outline=(255, 255, 255))
    import io
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def run_tests():
    print("==================================================")
    print("AGRIMIND 2.0: TAMIL TRANSLATED RESULTS VERIFICATION")
    print("==================================================")
    
    leaf_bytes = create_synthetic_leaf()
    non_plant_bytes = create_non_plant_image()
    
    # Test 1: Full Tamil Diagnosis Report for Rice
    status, data = send_image_request(leaf_bytes, crop_name="Rice (Paddy)")
    assert status == 200, f"Expected 200, got {status}"
    assert "tamil_report" in data, "tamil_report missing from response"
    ta = data["tamil_report"]
    print("\n--- Test 1: Rice Diagnosis (Tamil Fields Validation) ---")
    print(f"HTTP Status: {status}")
    print(f"1. கண்டறியப்பட்ட பயிர் (Detected Crop): {ta.get('detected_crop')}")
    print(f"2. தாவரத்தின் நிலை (Plant Condition): {ta.get('plant_condition')}")
    print(f"3. சாத்தியமான நோய் (Possible Problem): {ta.get('possible_problem')}")
    print(f"4. அறிகுறிகள் (Symptoms): {ta.get('symptoms')[:60]}...")
    print(f"5. பரிந்துரைக்கப்படும் நடவடிக்கைகள் (Recommended Actions): {len(ta.get('recommended_actions', []))} items")
    print(f"6. தடுப்பு முறைகள் (Prevention): {len(ta.get('prevention', []))} items")
    print(f"7. ஆதாரங்கள் (Sources): {len(data.get('sources', []))} citations")
    print(f"8. நம்பகத்தன்மை (Confidence): {ta.get('confidence_and_limitations')[:70]}...")
    
    assert ta.get("detected_crop"), "Missing detected_crop in Tamil"
    assert ta.get("plant_condition"), "Missing plant_condition in Tamil"
    assert ta.get("possible_problem"), "Missing possible_problem in Tamil"
    assert ta.get("symptoms"), "Missing symptoms in Tamil"
    assert len(ta.get("recommended_actions", [])) > 0, "Missing recommended_actions in Tamil"
    assert len(ta.get("prevention", [])) > 0, "Missing prevention in Tamil"
    assert ta.get("confidence_and_limitations"), "Missing confidence_and_limitations in Tamil"
    
    # Test 2: Tomato Leaf Spot in Tamil
    status, data2 = send_image_request(leaf_bytes, crop_name="Tomato")
    assert status == 200
    ta2 = data2["tamil_report"]
    print("\n--- Test 2: Tomato Diagnosis in Tamil ---")
    print(f"Detected Crop: {ta2.get('detected_crop')}")
    print(f"Problem: {ta2.get('possible_problem')}")
    assert "தக்காளி" in ta2.get("detected_crop", ""), "Tamil crop name should contain 'தக்காளி'"
    
    # Test 3: Non-Plant Image Abstention in Tamil
    status, data3 = send_image_request(non_plant_bytes)
    assert status == 200
    ta3 = data3["tamil_report"]
    print("\n--- Test 3: Non-Plant Rejection in Tamil ---")
    print(f"Status: {data3.get('analysis_status')}")
    print(f"Tamil Problem: {ta3.get('possible_problem')}")
    print(f"Tamil Action: {ta3.get('next_actions')}")
    assert "தாவர" in ta3.get("possible_problem", "") or "பயிர்" in ta3.get("possible_problem", "")
    
    # Test 4: Banana Crop in Tamil
    status, data4 = send_image_request(leaf_bytes, crop_name="Banana")
    assert status == 200
    ta4 = data4["tamil_report"]
    print("\n--- Test 4: Banana Diagnosis in Tamil ---")
    print(f"Detected Crop: {ta4.get('detected_crop')}")
    print(f"Problem: {ta4.get('possible_problem')}")
    assert "வாழை" in ta4.get("detected_crop", ""), "Tamil crop name should contain 'வாழை'"

    print("\n==================================================")
    print("ALL TAMIL TRANSLATION VERIFICATION TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
