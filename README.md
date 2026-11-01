# AgriMind — Multimodal AI Assistant for Sustainable Agriculture

**AgriMind** is an AI-powered agricultural decision-support platform designed to help farmers identify crop problems and receive accessible, evidence-grounded agricultural guidance in Tamil, English, and Tamil-English code-mixed queries.

---

## 🌾 Sustainable Development Goals
- **Primary:** **SDG 2 — Zero Hunger** (Doubling agricultural productivity and ensuring sustainable food production systems)
- **Supporting:** **SDG 12 — Responsible Consumption and Production** & **SDG 13 — Climate Action**

---

## 🏗️ Architecture & Technology Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts (responsive desktop/tablet/mobile design with nature-inspired emerald palette).
- **Backend:** FastAPI (Python 3.10+), Pydantic v2, SQLAlchemy ORM, SQLite persistent database.
- **AI & NLP Pipeline:**
  - Multilingual Tamil/English Unicode heuristic detector & transliteration bridge.
  - Hybrid RAG (Retrieval-Augmented Generation) document ingestion & passage retrieval over TNAU & ICAR agricultural literature.
  - Computer Vision crop disease classification contract with Pillow MIME & format validation.
  - Context-aware agro-meteorological advisory with regional agro-climate integration.
- **Testing & Verification:** Pytest suite, automated endpoint regression tests, and a dedicated in-app **Test Lab & Validation Center**.

---

## 🧭 Navigation & Modules

1. **Overview Dashboard (`/`):** Live database statistics, query activity charts, language distributions, quick actions, and recent farmer activity.
2. **AI Agricultural Assistant (`/chat`):** Interactive chat interface supporting Tamil (`ta`), English (`en`), and transliterated queries, citation grounding, and feedback recording.
3. **Crop Disease Detection (`/disease`):** Drag-and-drop leaf image upload, file format and corruption verification, model architecture inspection, and RAG-linked treatment guidance.
4. **Agricultural Knowledge Base (`/knowledge`):** PDF/TXT/CSV document upload, text extraction, chunking, and index inspection.
5. **Weather Intelligence (`/weather`):** Location-based weather lookups, humidity/temperature/wind monitoring, and spray/irrigation advisories.
6. **Sustainable Farming Guide (`/sustainable`):** Searchable agronomic repository (AWD paddy irrigation, Green manuring, IPM, Leaf Color Chart fertilizer management, Trichoderma biocontrol, Legume rotation).
7. **Query History (`/history`):** Persistent database log of past queries, language badges, session inspection, and privacy-respecting conversation deletion.
8. **Model Evaluation (`/evaluation`):** Research evaluation dashboard featuring confusion matrix, precision/recall/F1, retrieval P@K/MRR/faithfulness, and abstention rates.
9. **Settings & About (`/settings`):** Language preferences, interface options, live backend service diagnostics, privacy notices, and demo session resets.
10. **Test Lab & Validation Center (`/test-lab`):** Interactive execution console preloaded with 12 structured validation tests (`NLP-001` through `E2E-001`), filterable categories, and execution statistics.
11. **Faculty Demo Guide:** Floating interactive presentation wizard providing a step-by-step walkthrough for academic reviews.

---

## 🚀 Local Startup Instructions

### 1. Backend (FastAPI)
```powershell
cd c:\NLP\agrimind\backend
# Start the FastAPI server on port 8080:
uvicorn app.main:app --port 8080 --reload
```
*API docs available at: `http://localhost:8080/docs`*

### 2. Frontend (React + Vite)
```powershell
cd c:\NLP\agrimind\frontend
# Start Vite development server:
npm run dev
```
*Web application available at: `http://localhost:3001/`*

### 3. Run Automated Tests
```powershell
cd c:\NLP\agrimind\backend
python -m pytest tests
```

### 4. Seed Demonstration Data
```powershell
cd c:\NLP\agrimind
python scripts\seed_demo_data.py
```

---

## 📡 Backend API Endpoints (v1)

- `GET  /api/v1/health` — Service health & component status
- `POST /api/v1/chat/` — Agricultural query processing with RAG retrieval
- `GET  /api/v1/conversations` — List stored conversations
- `GET  /api/v1/chat/conversations/{session_id}` — Get messages & sources for a session
- `DELETE /api/v1/conversations/{session_id}` — Clear session history
- `POST /api/v1/disease/predict` — Validate leaf image & run disease inference
- `GET  /api/v1/disease/models` — List available CV models & supported crops
- `POST /api/v1/documents/upload` — Ingest and chunk agricultural document
- `GET  /api/v1/documents/` — List indexed documents
- `GET  /api/v1/weather` — Weather lookup & farming advisory
- `GET  /api/v1/sustainable/` — Search sustainable agronomy practices
- `GET  /api/v1/evaluation/metrics` — Research model evaluation benchmark results
- `POST /api/v1/feedback/` — Record user helpfulness rating
- `GET  /api/v1/test-lab/cases` — List 12 predefined test cases
- `POST /api/v1/test-lab/run/{test_id}` — Execute a specific test case
- `POST /api/v1/test-lab/run-suite` — Execute all test cases

---

## 🔒 Environment Configuration

Create a `.env` file in `backend/` if connecting external live API providers:
```env
# Optional external weather key (defaults to Tamil Nadu Agro-Climate profile when omitted):
OPENWEATHER_API_KEY=your_openweather_api_key

# Optional custom database URL (defaults to SQLite data/agrimind.db):
DATABASE_URL=sqlite:///C:/NLP/agrimind/data/agrimind.db
```
