import os
import re
import datetime
from sqlalchemy.orm import Session
from app.db import models

def extract_text_from_pdf(file_path: str):
    """
    Extract text page-by-page from a PDF using pypdf.
    Returns a list of dicts: [{'page_number': int, 'text': str}]
    """
    import pypdf
    pages_data = []
    try:
        reader = pypdf.PdfReader(file_path)
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            # Clean up whitespace and non-printable artifacts
            cleaned = re.sub(r'\s+', ' ', text).strip()
            if cleaned:
                pages_data.append({
                    "page_number": idx + 1,
                    "text": cleaned
                })
    except Exception as e:
        print(f"Error extracting PDF text from {file_path}: {e}")
    return pages_data

def chunk_text(text: str, chunk_size: int = 350, overlap: int = 50) -> list[str]:
    """
    Split text into overlapping chunks of approximate word count.
    """
    words = text.split()
    if len(words) <= chunk_size:
        return [text] if text else []
    
    chunks = []
    step = chunk_size - overlap
    for i in range(0, len(words), step):
        chunk_words = words[i:i + chunk_size]
        if len(chunk_words) > 20:  # Avoid tiny trailing chunks
            chunks.append(" ".join(chunk_words))
    return chunks

def ingest_document(
    file_path: str,
    file_name: str,
    title: str,
    source_name: str,
    source_url: str,
    document_type: str,
    db: Session
) -> models.Document:
    """
    Ingest a document file, extract text, generate chunks with page numbers, and persist in SQLite.
    """
    # 1. Check if already exists in DB
    existing = db.query(models.Document).filter(models.Document.file_name == file_name).first()
    if existing:
        return existing

    doc = models.Document(
        title=title or file_name,
        source_name=source_name or "AgriMind Knowledge Base",
        source_url=source_url or "https://agritech.tnau.ac.in/",
        file_name=file_name,
        document_type=document_type,
        indexing_status="processing"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        extracted_pages = []
        if file_name.lower().endswith(".pdf"):
            extracted_pages = extract_text_from_pdf(file_path)
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                cleaned = re.sub(r'\s+', ' ', content).strip()
                if cleaned:
                    extracted_pages = [{"page_number": 1, "text": cleaned}]

        if not extracted_pages:
            doc.indexing_status = "failed"
            doc.error_message = "No extractable text found in file."
            db.commit()
            return doc

        chunk_counter = 0
        for page in extracted_pages:
            page_num = page["page_number"]
            page_text = page["text"]
            text_chunks = chunk_text(page_text, chunk_size=300, overlap=40)
            
            for ch in text_chunks:
                chunk_record = models.DocumentChunk(
                    document_id=doc.id,
                    chunk_index=chunk_counter,
                    page_number=page_num,
                    text_content=ch,
                    vector_reference=f"chunk_{doc.id}_{chunk_counter}"
                )
                db.add(chunk_record)
                chunk_counter += 1

        doc.indexing_status = "completed"
        doc.error_message = None
        db.commit()
        db.refresh(doc)
        print(f"Successfully indexed document '{file_name}' with {chunk_counter} chunks across {len(extracted_pages)} pages.")
        return doc

    except Exception as e:
        doc.indexing_status = "failed"
        doc.error_message = str(e)
        db.commit()
        print(f"Failed to ingest document '{file_name}': {e}")
        return doc

def ensure_default_knowledge_base(db: Session):
    """
    Automatically index AgriMind_Agriculture_Knowledge_Base.pdf on startup if not present.
    """
    default_filename = "AgriMind_Agriculture_Knowledge_Base.pdf"
    existing = db.query(models.Document).filter(models.Document.file_name == default_filename).first()
    if existing and existing.indexing_status == "completed" and existing.chunks:
        return existing

    # Look for PDF in standard data location
    possible_paths = [
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "documents", default_filename),
        os.path.join(os.path.dirname(__file__), "..", "..", "data", "documents", default_filename),
        os.path.join("c:/NLP/agrimind/data/documents", default_filename),
        os.path.join(os.path.expanduser("~"), "Downloads", default_filename)
    ]

    found_path = None
    for p in possible_paths:
        if os.path.exists(p):
            found_path = p
            break

    if found_path:
        print(f"Found default knowledge base at {found_path}. Indexing...")
        return ingest_document(
            file_path=found_path,
            file_name=default_filename,
            title="AgriMind Agriculture Knowledge Base (v1.0 - TNAU/ICAR Synthesis)",
            source_name="TNAU & ICAR Agricultural Research Synthesis",
            source_url="https://agritech.tnau.ac.in/",
            document_type="pdf",
            db=db
        )
    else:
        print("Default knowledge base PDF not found on disk.")
        return None
