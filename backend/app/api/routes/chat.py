import time
import logging
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models, schemas
from app.services import nlp_service, rag_service, llm_service, domain_gate

logger = logging.getLogger("agrimind.chat")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

router = APIRouter()

SYSTEM_INSTRUCTION = """You are AgriMind, an expert, evidence-grounded Multimodal AI Assistant for Sustainable Agriculture, with specialized focus on Indian agriculture, particularly Tamil Nadu.
Your mission is to provide clear, practical, empathetic, and evidence-grounded agricultural guidance to farmers, agronomists, and extension workers.
Always adhere strictly to these safety and agronomic rules:
1. Multilingual Understanding & Response Language Fidelity:
   - Understand English, Tamil script (தமிழ்), and Tanglish (Tamil language typed using the English/Latin alphabet, e.g. "enakku oru doubt", "en thakkali chedi la elai manjala irukku").
   - Respond strictly in the user's preferred language:
     * If query is in English -> respond in English.
     * If query is in Tamil script -> respond in Tamil script (தமிழ்).
     * If query is in Tanglish -> respond in natural, friendly, easy-to-understand Tanglish (English letters). Do not switch to Tamil script or dry English.
2. Conversational Openings & Greetings:
   - For friendly greetings ("Hi", "Hello", "Vanakkam") or open inquiries ("enakku oru doubt", "help pannunga", "oru kelvi kekalama?"):
     * Respond warmly and conversationally in the user's language.
     * Do NOT force a premature disease diagnosis or dump generic textbook passages.
     * Invite the user to describe their crop, soil, fertilizer, pest, or irrigation problem (e.g., in Tanglish: "Kandippa! Enna doubt? Unga payir, chedi, uram, noi, poochi, illa irrigation pathi kelunga. Ungalukku enna problem irukku?").
3. Agronomic Problem Analysis:
   - When a crop issue is mentioned (e.g. yellow leaves, leaf curl, wilting, insect damage, stunted growth):
     * Explain plausible causes (water stress, nutrient deficiency, soil conditions, root damage, or fungal/bacterial disease) rather than declaring a single definitive disease.
     * Ask 2-3 focused diagnostic follow-up questions (e.g., are older or younger leaves affected, is the soil dry or waterlogged, are there spots/lesions).
     * Recommend uploading a leaf photo on the Crop Health page for visual AI diagnosis.
4. Grounding in Evidence & Safety:
   - Ground recommendations in the provided TNAU / ICAR evidence whenever available.
   - Avoid inventing chemical pesticide dosages or unverified spray recipes.
   - For chemical treatments, recommend checking official registered product labels and consulting the local Block Agriculture Office or Krishi Vigyan Kendra (KVK).
5. Continuity in Multi-Turn Conversations:
   - Maintain context across follow-up turns. If the user provides a brief reply (e.g. "pazhaiya elai mattum" or "bottom leaves only"), interpret it directly within the previous crop and diagnostic context.
6. Agriculture Domain Focus:
   - AgriMind is exclusively an agricultural assistant. If a query is unrelated to farming or agriculture, politely redirect in the user's language.
"""

@router.post("/", response_model=schemas.ChatResponse)
def chat_with_assistant(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    start_time = time.time()
    query_text = request.query.strip()
    session_id = request.session_id.strip() if request.session_id else str(uuid.uuid4())
    req_id = f"REQ-CHAT-{uuid.uuid4().hex[:8].upper()}"
    
    # 1. Detect language
    detected_language = nlp_service.detect_language(query_text)
    if request.language in ["en", "ta", "tanglish", "mixed"] and request.language != "auto":
        effective_language = request.language
    else:
        effective_language = detected_language
    
    # 2. Get or create conversation record
    conv = db.query(models.Conversation).filter(models.Conversation.session_id == session_id).first()
    if not conv:
        conv = models.Conversation(session_id=session_id)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # 3. Fetch recent conversation history (for multi-turn continuity)
    recent_msgs = db.query(models.Message).filter(
        models.Message.conversation_id == conv.id
    ).order_by(models.Message.created_at.desc()).limit(6).all()
    recent_msgs.reverse()
    
    conversation_history = [
        {"role": m.role, "content": m.response_text if m.role == "assistant" else (m.original_query or m.response_text)}
        for m in recent_msgs
    ]

    logger.info(f"[REQUEST {req_id}] Session: {session_id[:8]} | Lang: {effective_language} (det: {detected_language}) | Query: '{query_text[:80]}'")

    # 4. Agriculture-Domain Validation Gate with Conversation History Context
    domain_check = domain_gate.validate_agricultural_domain(
        query_text,
        language=effective_language,
        conversation_history=conversation_history
    )
    if not domain_check["is_valid"]:
        logger.warning(f"[DOMAIN GATE] Blocked query '{query_text[:50]}': {domain_check['reason']}")
        return schemas.ChatResponse(
            response=domain_check["refusal_message"],
            message_id=0,
            language=effective_language,
            sources=[],
            status="out_of_domain",
            request_id=req_id,
            domain_status="rejected_out_of_domain",
            provider="AgriMind Domain Gate"
        )

    intent = nlp_service.classify_intent(query_text)
    logger.info(f"[INTENT] Category: '{intent}'")

    response_text = ""
    status = "success"
    provider_used = "Local RAG Synthesis"
    retrieved = []
    sources_response = []

    # Case A: Conversational Greetings, Opening Inquiries & System Capabilities
    if intent in ["greeting_conversational", "greeting", "capability"]:
        llm_status = llm_service.get_llm_status()
        if llm_status["configured"]:
            llm_resp, llm_st = llm_service.generate_chat_response(
                query=query_text,
                system_instruction=SYSTEM_INSTRUCTION,
                retrieved_context=None,
                conversation_history=conversation_history,
                target_language=effective_language
            )
            if llm_resp:
                response_text = llm_resp
                provider_used = f"{llm_status['provider']} ({llm_status['model']})"
            else:
                response_text = nlp_service.get_conversational_response(intent, query_text, effective_language)
        else:
            response_text = nlp_service.get_conversational_response(intent, query_text, effective_language)

    # Case B: Agricultural & Domain Inquiries
    else:
        retrieved = rag_service.retrieve_documents(query_text, db, top_k=3)
        context_str = ""
        if retrieved:
            context_pieces = []
            for d in retrieved:
                page_info = f" (Page {d['page_number']})" if d.get('page_number') else ""
                context_pieces.append(f"Source: {d['title']}{page_info}\nExcerpt:\n{d['text_content']}")
            context_str = "\n\n".join(context_pieces)

        llm_status = llm_service.get_llm_status()
        if llm_status["configured"]:
            llm_resp, llm_st = llm_service.generate_chat_response(
                query=query_text,
                system_instruction=SYSTEM_INSTRUCTION,
                retrieved_context=context_str if retrieved else None,
                conversation_history=conversation_history,
                target_language=effective_language
            )
            if llm_resp:
                response_text = llm_resp
                provider_used = f"{llm_status['provider']} ({llm_status['model']})"
                status = "success"
            else:
                rag_resp, status = rag_service.generate_grounded_answer(
                    query=query_text,
                    retrieved_docs=retrieved,
                    target_language=effective_language,
                    intent=intent,
                    conversation_history=conversation_history
                )
                err_detail = f"Gemini API returned: {llm_st}"
                notice = f"\n\n*(Notice: {err_detail}. Response synthesized directly from local verified TNAU/ICAR research documents.)*"
                response_text = rag_resp + notice
                provider_used = f"TNAU Knowledge Base (Fallback: {llm_st})"
        else:
            response_text, status = rag_service.generate_grounded_answer(
                query=query_text,
                retrieved_docs=retrieved,
                target_language=effective_language,
                intent=intent,
                conversation_history=conversation_history
            )

    # 5. Save User Message
    user_msg = models.Message(
        conversation_id=conv.id,
        role="user",
        original_query=query_text,
        detected_language=effective_language,
        response_text=query_text
    )
    db.add(user_msg)
    db.commit()

    # 6. Save Assistant Message
    asst_msg = models.Message(
        conversation_id=conv.id,
        role="assistant",
        response_text=response_text,
        status=status
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)

    # 7. Format Retrieved Sources
    if retrieved:
        for doc in retrieved:
            rs = models.RetrievedSource(
                message_id=asst_msg.id,
                document_id=doc["document_id"],
                chunk_id=doc["chunk_id"],
                similarity_score=doc["similarity_score"],
                page_number=doc.get("page_number")
            )
            db.add(rs)
            sources_response.append(schemas.RetrievedSourceResponse(
                document_title=doc["title"],
                source_url=doc.get("source_url"),
                page_number=doc.get("page_number"),
                similarity_score=doc["similarity_score"],
                text_content=doc.get("text_content")
            ))
        db.commit()

    return schemas.ChatResponse(
        response=response_text,
        message_id=asst_msg.id,
        language=effective_language,
        sources=sources_response,
        status=status,
        request_id=req_id,
        domain_status="agricultural",
        provider=provider_used
    )

@router.get("/conversations")
def list_conversations(db: Session = Depends(get_db)):
    convs = db.query(models.Conversation).order_by(models.Conversation.updated_at.desc()).limit(50).all()
    results = []
    for c in convs:
        first_user_msg = db.query(models.Message).filter(
            models.Message.conversation_id == c.id,
            models.Message.role == "user"
        ).order_by(models.Message.created_at.asc()).first()
        msg_count = db.query(models.Message).filter(models.Message.conversation_id == c.id).count()
        results.append({
            "id": c.id,
            "session_id": c.session_id,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "message_count": msg_count,
            "preview": first_user_msg.original_query if first_user_msg else "Agricultural query",
            "language": first_user_msg.detected_language if first_user_msg else "en"
        })
    return results

@router.get("/conversations/{session_id}", response_model=schemas.ConversationResponse)
def get_conversation(session_id: str, db: Session = Depends(get_db)):
    conv = db.query(models.Conversation).filter(models.Conversation.session_id == session_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.delete("/conversations/{session_id}")
def clear_conversation(session_id: str, db: Session = Depends(get_db)):
    conv = db.query(models.Conversation).filter(models.Conversation.session_id == session_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return {"status": "success", "message": f"Conversation {session_id} cleared successfully."}
