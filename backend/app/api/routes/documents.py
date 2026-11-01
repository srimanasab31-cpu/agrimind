import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models, schemas
from app.services import document_service, rag_service

router = APIRouter()

@router.get("/search")
def search_knowledge_base(q: str, top_k: int = 5, db: Session = Depends(get_db)):
    """
    Direct RAG search over indexed document chunks.
    Allows farmers and researchers to test retrieval precision.
    """
    if not q or not q.strip():
        return {"query": q, "results": [], "count": 0}
    results = rag_service.retrieve_documents(query=q, db=db, top_k=top_k)
    return {
        "query": q,
        "results": results,
        "count": len(results)
    }

@router.get("/", response_model=list[schemas.DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    """
    List all indexed agricultural documents and their chunk counts.
    Ensures default knowledge base is loaded if table is empty.
    """
    docs = db.query(models.Document).order_by(models.Document.uploaded_at.desc()).all()
    if not docs:
        document_service.ensure_default_knowledge_base(db)
        docs = db.query(models.Document).order_by(models.Document.uploaded_at.desc()).all()
    return docs

@router.post("/upload", response_model=schemas.DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(None),
    source_name: str = Form(None),
    source_url: str = Form(None),
    document_type: str = Form("pdf"),
    db: Session = Depends(get_db)
):
    """
    Upload and parse an agricultural reference document (PDF, TXT, CSV, MD).
    Extracts text page-by-page and creates chunks with metadata.
    """
    upload_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "documents")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, file.filename)
    
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Cannot upload an empty file.")
        
    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    doc = document_service.ingest_document(
        file_path=file_path,
        file_name=file.filename,
        title=title or file.filename.replace("_", " ").replace(".pdf", ""),
        source_name=source_name or "User Uploaded Agricultural Document",
        source_url=source_url,
        document_type=document_type,
        db=db
    )

    if doc.indexing_status == "failed":
        raise HTTPException(status_code=400, detail=f"Failed to extract text: {doc.error_message}")

    return schemas.DocumentUploadResponse(
        document_id=doc.id,
        file_name=file.filename,
        status="Document indexed successfully"
    )

@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    upload_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "documents")
    file_path = os.path.join(upload_dir, doc.file_name)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Could not remove file {file_path}: {e}")
        
    db.delete(doc)
    db.commit()
    return {"message": "Document and associated chunks deleted successfully"}
