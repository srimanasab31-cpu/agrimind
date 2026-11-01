import urllib.request
import io
import json
from PIL import Image

# 1. Create a synthetic test leaf image (green leaf with some brown spots)
img = Image.new('RGB', (224, 224), color=(40, 160, 40))
for x in range(80, 140):
    for y in range(80, 140):
        img.putpixel((x, y), (139, 69, 19)) # brown necrotic spot

buf = io.BytesIO()
img.save(buf, format='JPEG')
jpeg_bytes = buf.getvalue()

boundary = '----AgriMindTestBoundary12345'
parts = []
# file part
header = (
    f'--{boundary}\r\n'
    'Content-Disposition: form-data; name="file"; filename="test_leaf.jpg"\r\n'
    'Content-Type: image/jpeg\r\n\r\n'
).encode('utf-8')
parts.append(header)
parts.append(jpeg_bytes)
parts.append(b'\r\n')

# crop_name part
parts.append(
    (
        f'--{boundary}\r\n'
        'Content-Disposition: form-data; name="crop_name"\r\n\r\n'
        'Tomato\r\n'
    ).encode('utf-8')
)

# district part
parts.append(
    (
        f'--{boundary}\r\n'
        'Content-Disposition: form-data; name="district"\r\n\r\n'
        'Thanjavur\r\n'
    ).encode('utf-8')
)

parts.append(f'--{boundary}--\r\n'.encode('utf-8'))
body = b''.join(parts)

req = urllib.request.Request(
    'http://127.0.0.1:3000/api/v1/disease/predict',
    data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

try:
    with urllib.request.urlopen(req) as resp:
        print('HTTP Status:', resp.getcode())
        data = json.loads(resp.read().decode('utf-8'))
        print('Request ID:', data.get('request_id'))
        print('Crop Name:', data.get('crop_name'))
        print('Predicted Class:', data.get('predicted_class'))
        print('Confidence:', data.get('confidence'))
        print('Status:', data.get('status'))
        print('Keys in response:', list(data.keys()))
except urllib.error.HTTPError as e:
    print('HTTP Error:', e.code)
    print(e.read().decode('utf-8'))
except Exception as e:
    print('Error:', e)
