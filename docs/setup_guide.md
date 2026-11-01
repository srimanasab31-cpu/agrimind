# AgriMind Setup Guide

## System Requirements
- Node.js 18+
- Python 3.10+
- OS: Windows/Linux/MacOS

## Backend Setup
1. **Initialize the Virtual Environment**:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
```
2. **Install Dependencies**:
```bash
pip install -r requirements.txt
```
*(Note: Uncomment `sentence-transformers` and `faiss-cpu` in requirements for deep-learning powered RAG, but ensure PyTorch is installed correctly for your OS/Hardware)*

3. **Start the API Server**:
```bash
uvicorn app.main:app --port 8080 --reload
```

## Frontend Setup
1. **Install Modules**:
```bash
cd frontend
npm install
```
2. **Start Dev Server**:
```bash
npm run dev
```

## Running Demo Data
To populate the dashboard with metrics:
```bash
cd scripts
python seed_demo_data.py
```
