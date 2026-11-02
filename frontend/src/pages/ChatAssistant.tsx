import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Send, Sparkles, BookOpen, AlertCircle, RefreshCw, PlusCircle,
  Leaf, Globe, Check, ExternalLink, ChevronDown, ChevronUp, Bot, User
} from 'lucide-react';

const API_BASE_URL = 'https://agrimind-ieec.onrender.com/api/v1';

interface Source {
  document_title: string;
  source_url?: string;
  page_number?: number;
  similarity_score: number;
  text_content?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  status?: string;
  timestamp?: string;
  request_id?: string;
  domain_status?: string;
  provider?: string;
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string>(() => {
    return localStorage.getItem('agrimind_session') ||
      (crypto.randomUUID ? crypto.randomUUID() : 'sess_' + Math.random().toString(36).substring(2, 9));
  });
  const [language, setLanguage] = useState<string>(() => localStorage.getItem('agrimind_lang') || 'auto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<string | null>(null);
  const [llmStatus, setLlmStatus] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem('agrimind_session', sessionId);
    loadConversation(sessionId);
    fetchLLMStatus();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchLLMStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/health`);
      if (res.data?.components?.llm_provider) {
        setLlmStatus(res.data.components.llm_provider);
      }
    } catch (e) {
      console.warn("Could not check LLM status:", e);
    }
  };

  const loadConversation = async (sid: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/chat/conversations/${sid}`);
      if (res.data && res.data.messages && res.data.messages.length > 0) {
        const history: Message[] = res.data.messages.map((m: any) => ({
          role: m.role,
          content: m.response_text,
          sources: m.retrieved_sources || [],
          status: m.status,
          timestamp: m.created_at
        }));
        setMessages(history);
      } else {
        setMessages([]);
      }
    } catch (err) {
      // Clean slate for new session
      setMessages([]);
    }
  };

  const handleStartNewChat = () => {
    const newSid = 'sess_' + Math.random().toString(36).substring(2, 9);
    setSessionId(newSid);
    localStorage.setItem('agrimind_session', newSid);
    setMessages([]);
    setInput('');
    setError(null);
    setLastFailedQuery(null);
  };

  const sendMessage = async (textToSend: string) => {
    const query = textToSend.trim();
    if (!query || loading) return;

    setError(null);
    setLastFailedQuery(null);

    const userMsg: Message = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/chat/`, {
        query: query,
        language: language,
        session_id: sessionId
      }, { timeout: 120000 });

      const assistantMsg: Message = {
        role: 'assistant',
        content: res.data.response,
        sources: res.data.sources || [],
        status: res.data.status,
        timestamp: new Date().toISOString(),
        request_id: res.data.request_id,
        domain_status: res.data.domain_status,
        provider: res.data.provider
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg = axios.isCancel(err)
  ? "Request cancelled. Please try again."
  : err.code === 'ECONNABORTED'
  ? "The AI is taking longer than expected. Please try again."
  : err.response?.data?.detail || "Unable to connect to the server. Please try again.";
      setError(errorMsg);
      setLastFailedQuery(query);
      setInput(query);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const suggestedQuestions = [
    "en thakkali chedi la elai manjala irukku",
    "thakkali chediku enna uram podanum?",
    "nel payir la ilai karugudhu",
    "vazhai marathula poochi irukku",
    "What fertilizer is suitable for tomato?",
    "நெல் இலைகள் மஞ்சளாக மாறுகின்றன",
    "enakku oru doubt"
  ];
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 7rem)', maxWidth: 960, margin: '0 auto',
      background: '#FFFFFF', borderRadius: 20,
      border: '1.5px solid #C3E6CB',
      boxShadow: '0 4px 24px rgba(10,74,46,0.1)',
      overflow: 'hidden', fontFamily: "'Inter', sans-serif"
    }}>

      {/* ── CHAT HEADER ── */}
      <div style={{
        padding: '14px 22px',
        background: 'linear-gradient(135deg, #0A1F0F, #0D2B17)',
        borderBottom: '1px solid rgba(201,168,76,0.2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', overflow: 'hidden', flexShrink: 0
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '35%',
          background: 'radial-gradient(ellipse at right, rgba(201,168,76,0.08), transparent)',
          pointerEvents: 'none'
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #1A5C31, #0D2B17)',
            border: '1.5px solid rgba(201,168,76,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            <Leaf size={18} style={{ color: '#4DB870' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', margin: 0
              }}>AgriMind AI Assistant</h2>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700,
                background: 'rgba(201,168,76,0.15)', color: '#C9A84C',
                border: '1px solid rgba(201,168,76,0.35)',
                padding: '2px 8px', borderRadius: 100, letterSpacing: '0.06em', textTransform: 'uppercase'
              }}>TNAU / ICAR Grounded</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(168,239,196,0.7)', fontWeight: 500 }}>
              {llmStatus?.configured ? `Connected: ${llmStatus.provider} (${llmStatus.model})` : "Active: Grounded Knowledge Base Engine"}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 10, padding: '4px 8px 4px 10px'
          }}>
            <Globe size={13} style={{ color: '#4DB870' }} />
            <select
              value={language}
              onChange={(e) => { setLanguage(e.target.value); localStorage.setItem('agrimind_lang', e.target.value); }}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#F0FFF4', fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Inter',sans-serif"
              }}
            >
              <option value="auto" style={{ color: '#000' }}>🌐 Auto-detect (Auto)</option>
              <option value="tanglish" style={{ color: '#000' }}>🗣️ Tanglish (தமிழ் in English)</option>
              <option value="ta" style={{ color: '#000' }}>🇮🇳 தமிழ் (Tamil Script)</option>
              <option value="en" style={{ color: '#000' }}>🇬🇧 English (EN)</option>
            </select>
          </div>

          <button
            onClick={handleStartNewChat}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #C9A84C, #E8C96A)',
              color: '#0A1F0F', fontSize: '0.75rem', fontWeight: 700,
              padding: '7px 14px', borderRadius: 10, border: 'none',
              cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(201,168,76,0.3)'
            }}
          >
            <PlusCircle size={13} />
            New Chat
          </button>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, background: '#F9FFFE' }}>
        {messages.length === 0 && (
          <div style={{ maxWidth: 520, margin: '20px auto', textAlign: 'center' }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: 'linear-gradient(135deg, rgba(42,140,74,0.15), rgba(201,168,76,0.1))',
              border: '1.5px solid rgba(42,140,74,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <Sparkles size={26} style={{ color: '#1A5C31' }} />
            </div>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.4rem', fontWeight: 700, color: '#0A1F0F', marginBottom: 8
            }}>Welcome to AgriMind</h3>
            <p style={{ fontSize: '0.85rem', color: '#2D6A4F', fontWeight: 500, lineHeight: 1.7, marginBottom: 20 }}>
              Ask in English or Tamil. I provide evidence-backed guidance from TNAU &amp; ICAR knowledge base for crops, soil, water, and diseases.
            </p>

            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6B9E84', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
                Suggested Questions
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="agri-tag"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, maxWidth: '80%' }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, #0D2B17, #1A5C31)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  <Bot size={15} style={{ color: '#4DB870' }} />
                </div>
              )}

              <div className={msg.role === 'user' ? 'chat-user-bubble' : 'chat-bot-bubble'}>
                {msg.role === 'assistant' && msg.domain_status === 'rejected_out_of_domain' && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '3px 8px', borderRadius: 6, background: '#FEF2F2',
                    border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '0.72rem',
                    fontWeight: 700, marginBottom: 8
                  }}>
                    🛡️ Restricted to Agricultural Inquiries
                  </div>
                )}

                <div style={{
                  whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: 1.7,
                  color: msg.role === 'user' ? '#F0FFF4' : '#0A1F0F',
                  fontWeight: 500
                }}>
                  {msg.content}
                </div>

                {msg.role === 'assistant' && (msg.provider || msg.request_id) && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginTop: 8,
                    fontSize: '0.68rem', color: '#6B7280', fontWeight: 600
                  }}>
                    {msg.provider && <span>✨ {msg.provider}</span>}
                    {msg.request_id && <span style={{ fontFamily: 'monospace' }}>{msg.request_id}</span>}
                  </div>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(42,140,74,0.2)' }}>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 700, color: '#1A5C31',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8
                    }}>
                      <BookOpen size={13} /> Retrieved Citations ({msg.sources.length})
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {msg.sources.map((src, sIdx) => {
                        const key = `${idx}-${sIdx}`;
                        const isExpanded = expandedSourceIndex === key;
                        return (
                          <div
                            key={sIdx}
                            style={{
                              background: 'rgba(42,140,74,0.06)', border: '1px solid rgba(42,140,74,0.2)',
                              borderRadius: 10, padding: 10, fontSize: '0.75rem'
                            }}
                          >
                            <div
                              onClick={() => setExpandedSourceIndex(isExpanded ? null : key)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', flex: 1, paddingRight: 8 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2A8C4A', flexShrink: 0 }} />
                                <span style={{ fontWeight: 700, color: '#0A1F0F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {src.document_title}
                                </span>
                                {src.page_number && (
                                  <span style={{
                                    background: 'rgba(42,140,74,0.15)', color: '#1A5C31',
                                    padding: '1px 7px', borderRadius: 4, fontSize: '0.65rem',
                                    fontWeight: 700, flexShrink: 0
                                  }}>
                                    Pg {src.page_number}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1A5C31', fontWeight: 700, flexShrink: 0 }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                  {(src.similarity_score * 100).toFixed(0)}%
                                </span>
                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </div>
                            </div>
                            {isExpanded && src.text_content && (
                              <div style={{
                                marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(42,140,74,0.15)',
                                fontSize: '0.75rem', color: '#0A1F0F', fontWeight: 500, lineHeight: 1.7
                              }}>
                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#1A5C31', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>
                                  Retrieved Excerpt:
                                </span>
                                {src.text_content}
                                {src.source_url && (
                                  <a
                                    href={src.source_url}
                                    target="_blank" rel="noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1A5C31', marginTop: 6, fontWeight: 700, textDecoration: 'none', fontSize: '0.72rem' }}
                                  >
                                    View Reference <ExternalLink size={11} />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, #C3E6CB, #A8EFC4)',
                  border: '1px solid rgba(42,140,74,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2
                }}>
                  <User size={15} style={{ color: '#1A5C31' }} />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'linear-gradient(135deg, #0D2B17, #1A5C31)',
                border: '1px solid rgba(201,168,76,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={15} style={{ color: '#4DB870' }} />
              </div>
              <div style={{
                background: '#fff', border: '1.5px solid #C3E6CB',
                borderRadius: '16px 16px 16px 4px', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 4px rgba(10,74,46,0.08)'
              }}>
                <RefreshCw size={13} style={{ color: '#2A8C4A', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.8rem', color: '#1A5C31', fontWeight: 600 }}>
                  Searching knowledge base...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#FFF5F5', border: '1.5px solid #FCA5A5',
            borderRadius: 12, padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={15} style={{ color: '#DC2626', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: '#991B1B', fontWeight: 600 }}>{error}</span>
            </div>
            {lastFailedQuery && (
              <button
                onClick={() => sendMessage(lastFailedQuery)}
                style={{
                  background: '#DC2626', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '5px 12px', fontSize: '0.75rem',
                  fontWeight: 700, cursor: 'pointer'
                }}
              >Retry</button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick chips (active conversation) */}
      {messages.length > 0 && (
        <div style={{
          padding: '8px 20px', background: '#F5FFF7',
          borderTop: '1px solid #C3E6CB',
          display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', flexShrink: 0
        }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6B9E84', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
            Ask Next:
          </span>
          {suggestedQuestions.slice(0, 4).map((sq, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(sq)}
              disabled={loading}
              className="agri-tag"
              style={{ whiteSpace: 'nowrap', opacity: loading ? 0.5 : 1 }}
            >
              {sq}
            </button>
          ))}
        </div>
      )}

      {/* ── INPUT AREA ── */}
      <div style={{
        padding: '14px 20px 16px',
        background: '#fff',
        borderTop: '1.5px solid #C3E6CB',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 10,
          background: '#F5FFF7', border: '1.5px solid #C3E6CB',
          borderRadius: 14, padding: '8px 8px 8px 16px',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}
          onFocus={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#2A8C4A';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(42,140,74,0.1)';
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#C3E6CB';
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={language === 'ta'
              ? "உங்கள் விவசாயக் கேள்வியைத் தட்டச்சு செய்யவும்..."
              : language === 'tanglish'
              ? "Unga vivasaaya kelviyai Tanglish-la type pannunga..."
              : "Ask an agricultural question in English, Tanglish, or Tamil..."}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              resize: 'none', fontSize: '0.88rem', color: '#0A1F0F', fontWeight: 500,
              fontFamily: "'Inter',sans-serif", maxHeight: 128, padding: '4px 0',
              lineHeight: 1.65
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              padding: '9px 11px',
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #1A5C31, #2A8C4A)'
                : '#C3E6CB',
              color: '#fff',
              border: 'none', borderRadius: 10,
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s', flexShrink: 0,
              boxShadow: input.trim() && !loading ? '0 2px 10px rgba(42,140,74,0.3)' : 'none'
            }}
          >
            <Send size={16} />
          </button>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '0.65rem', color: '#6B9E84', fontWeight: 600, marginTop: 6, padding: '0 2px'
        }}>
          <span>AgriMind: Evidence-grounded · No unverified pesticide doses</span>
          <span>Enter to send · Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
