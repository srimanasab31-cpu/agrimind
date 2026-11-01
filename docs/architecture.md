# AgriMind Architecture

AgriMind operates on a standard 3-tier full-stack architecture, augmented with specialized AI modules for RAG and Computer Vision.

## 1. Presentation Tier (Frontend)
- **Framework**: React via Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Component Design**: Modular, reusable UI chunks mapping to functional domains (Chat, Knowledge Base, Weather, Dashboard).

## 2. Logic Tier (Backend API)
- **Framework**: FastAPI (Python)
- **Design Pattern**: Router-Service-Database layer separation.
- **Services**:
  - `rag_service.py`: Handles vector embeddings (or fallback keyword heuristics) to inject evidence into LLM prompts.
  - `nlp_service.py`: Performs language boundary detection (English/Tamil).
  - `disease_service.py`: Connects Image uploads to Deep Learning models (e.g., PyTorch ResNet/EfficientNet blocks).

## 3. Data Tier (Database)
- **Engine**: SQLite (Development mode) via SQLAlchemy ORM.
- **Relational Integrity**: Foreign Keys link `Conversations` -> `Messages` -> `RetrievedSources` to ensure accurate auditing and explainability of AI-generated responses.
