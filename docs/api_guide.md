# AgriMind API Guide

All endpoints operate under the `http://localhost:8080/api/v1` prefix.

## 1. Chat & Conversations
- `POST /chat/`: Submit a user query to the AI Assistant. Returns `response_text`, `sources`, and `message_id`.
- `GET /chat/conversations/{session_id}`: Retrieves full chat history for a session ID.

## 2. Documents (Knowledge Base)
- `GET /documents/`: List all indexed documents.
- `POST /documents/upload`: Multipart form-data upload for PDFs/TXT/CSV files.
- `DELETE /documents/{id}`: Unindex and delete a document.

## 3. Analytics
- `GET /analytics/overview`: Returns DB-aggregated metrics for queries, processed images, languages, and weather lookups used by the dashboard.

## 4. Health
- `GET /health`: Returns service statuses.
