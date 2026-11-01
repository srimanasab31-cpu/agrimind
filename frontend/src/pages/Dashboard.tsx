import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  MessageSquare, Camera, Book, Cpu, FlaskConical, ArrowRight,
  Sparkles, ShieldCheck, Database, Leaf, Droplets, Sun, Wind,
  TrendingUp, CheckCircle2, Sprout
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const StatCard = ({
  icon: Icon, value, label, color, bgColor
}: {
  icon: any; value: string | number; label: string; color: string; bgColor: string;
}) => (
  <div className="agri-card fade-up" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{
      width: 52, height: 52, borderRadius: 14,
      background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0
    }}>
      <Icon size={22} style={{ color }} />
    </div>
    <div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0A1F0F', fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
        {label}
      </div>
    </div>
  </div>
);

const CapabilityCard = ({
  to, icon: Icon, iconColor, iconBg, borderHover, title, desc, cta
}: {
  to: string; icon: any; iconColor: string; iconBg: string;
  borderHover: string; title: string; desc: string; cta: string;
}) => (
  <Link
    to={to}
    className="agri-card fade-up"
    style={{
      display: 'flex', flexDirection: 'column', padding: '24px',
      textDecoration: 'none', cursor: 'pointer'
    }}
  >
    <div style={{
      width: 50, height: 50, borderRadius: 14,
      background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 16, transition: 'transform 0.2s ease', flexShrink: 0
    }}>
      <Icon size={22} style={{ color: iconColor }} />
    </div>
    <h3 style={{
      fontFamily: "'Playfair Display', serif",
      fontSize: '1rem', fontWeight: 700,
      color: '#0A1F0F', marginBottom: 8
    }}>
      {title}
    </h3>
    <p style={{ fontSize: '0.8rem', color: '#1A3A25', fontWeight: 500, lineHeight: 1.65, flex: 1, margin: 0 }}>
      {desc}
    </p>
    <div style={{
      marginTop: 18, paddingTop: 14,
      borderTop: '1px solid #C3E6CB',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: '0.78rem', fontWeight: 700, color: '#1A5C31'
    }}>
      <span>{cta}</span>
      <ArrowRight size={15} style={{ color: '#2A8C4A', transition: 'transform 0.2s' }} />
    </div>
  </Link>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ total_queries: 0, images_analyzed: 0, knowledge_docs: 0, weather_lookups: 0 });
  const [health, setHealth] = useState<any>(null);
  const [quickQuery, setQuickQuery] = useState('');

  useEffect(() => {
    axios.get(`${API_BASE_URL}/analytics/overview`)
      .then(res => { if (res.data?.metrics) setMetrics(res.data.metrics); })
      .catch(() => { });
    axios.get(`${API_BASE_URL}/health`)
      .then(res => setHealth(res.data))
      .catch(() => { });
  }, []);

  const handleQuickAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) navigate('/chat', { state: { initialQuery: quickQuery } });
  };

  const samplePrompts = [
    { label: '🌾 Rice Blast', query: 'What are the symptoms and organic management for rice blast disease?' },
    { label: '🌿 நெல் இலை மஞ்சள்', query: 'நெல் இலையில் மஞ்சள் நிற புள்ளிகள் உள்ளன, என்ன தீர்வு?' },
    { label: '💧 Drip Irrigation', query: 'What is the recommended drip irrigation schedule for tomato crops?' },
    { label: '🌱 Urea & NPK', query: 'TNAU recommended split application for nitrogen fertilizer in paddy?' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 48 }}>

      {/* ── HERO BANNER ── */}
      <div className="agri-hero-banner fade-up" style={{ padding: '40px 44px', marginBottom: 28 }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.1), transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: '30%',
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74,184,112,0.1), transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680 }}>
          {/* Top badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 20
          }}>
            <Sparkles size={13} style={{ color: '#C9A84C' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#E8C96A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Multimodal AI · TNAU/ICAR Grounded · UN SDG 2 & 12
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 800, color: '#FFFFFF',
            lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.02em'
          }}>
            Evidence-Grounded AI for{' '}
            <span style={{
              background: 'linear-gradient(90deg, #C9A84C, #E8C96A)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              Sustainable Agriculture
            </span>
          </h1>

          <p style={{
            color: 'rgba(184,229,200,0.85)', fontSize: '0.92rem', lineHeight: 1.75,
            fontWeight: 500, marginBottom: 28, maxWidth: 560
          }}>
            AgriMind bridges advanced AI and verified agronomic research to provide farmers, researchers, and extension workers with explainable crop guidance in English and Tamil.
          </p>

          {/* Search bar */}
          <form onSubmit={handleQuickAsk}>
            <div style={{
              display: 'flex', gap: 10, flexWrap: 'wrap',
              background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(201,168,76,0.25)',
              borderRadius: 16, padding: '6px 6px 6px 16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
            }}>
              <Leaf size={17} style={{ color: '#4DB870', alignSelf: 'center', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Ask any agricultural question in English or தமிழ்…"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#F0FFF4', fontSize: '0.88rem', fontWeight: 500,
                  fontFamily: "'Inter',sans-serif", minWidth: 0, padding: '8px 0'
                }}
              />
              <button type="submit" className="btn-gold" style={{ padding: '8px 20px', borderRadius: 12, whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                Ask AgriMind →
              </button>
            </div>
          </form>

          {/* Quick chips */}
          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(168,239,196,0.6)', fontWeight: 600, alignSelf: 'center' }}>Try:</span>
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => navigate('/chat', { state: { initialQuery: p.query } })}
                style={{
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: 100, padding: '5px 14px',
                  color: 'rgba(232,201,106,0.9)', fontSize: '0.72rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.18s', backdropFilter: 'blur(4px)'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── METRICS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px,1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={MessageSquare} value={metrics.total_queries} label="Agronomic Queries"
          color="#1A5C31" bgColor="rgba(42,140,74,0.1)" />
        <StatCard icon={Database} value={health?.knowledge_base?.total_chunks || 31} label="Indexed PDF Chunks"
          color="#0D6E8A" bgColor="rgba(13,110,138,0.1)" />
        <StatCard icon={Camera} value={metrics.images_analyzed} label="Leaves Diagnosed"
          color="#8B6D28" bgColor="rgba(201,168,76,0.12)" />
        <StatCard
          icon={ShieldCheck}
          value={health?.status === 'healthy' ? 'Online' : 'Ready'}
          label="Grounded RAG Pipeline"
          color="#1A5C31" bgColor="rgba(42,140,74,0.1)"
        />
      </div>

      {/* ── PLATFORM CAPABILITIES ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.35rem', fontWeight: 700, color: '#0A1F0F', marginBottom: 2
            }}>Platform Capabilities</h2>
            <p style={{ fontSize: '0.8rem', color: '#2D6A4F', fontWeight: 500, margin: 0 }}>
              Explore AgriMind's research modules and agricultural workflows
            </p>
          </div>
          <Link to="/how-it-works" style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.78rem', fontWeight: 700, color: '#1A5C31', textDecoration: 'none'
          }}>
            Architecture <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 16 }}>
          <CapabilityCard
            to="/chat" icon={MessageSquare}
            iconColor="#1A5C31" iconBg="rgba(42,140,74,0.1)"
            borderHover="#2A8C4A"
            title="Multilingual AI Assistant"
            desc="Conversational agricultural guidance in English & Tamil with verifiable source citations from TNAU and ICAR publications."
            cta="Open Assistant"
          />
          <CapabilityCard
            to="/knowledge" icon={Book}
            iconColor="#0D6E8A" iconBg="rgba(13,110,138,0.1)"
            borderHover="#0D6E8A"
            title="Agricultural Knowledge Base"
            desc="Indexed TNAU crop production manuals, ICAR guides, and interactive RAG semantic retrieval with page-level citations."
            cta="Explore Documents"
          />
          <CapabilityCard
            to="/crop-health" icon={Camera}
            iconColor="#8B6D28" iconBg="rgba(201,168,76,0.12)"
            borderHover="#C9A84C"
            title="Crop Health & Vision"
            desc="Upload leaf photos for AI disease classification, pathological confidence scores, and grounded agronomic remedies."
            cta="Upload Leaf Image"
          />
          <CapabilityCard
            to="/test-lab" icon={FlaskConical}
            iconColor="#6B3FA0" iconBg="rgba(107,63,160,0.1)"
            borderHover="#6B3FA0"
            title="Test Lab & Validation"
            desc="End-to-end automated test suite covering NLP intents, RAG retrieval quality, and computer vision accuracy benchmarks."
            cta="Run Test Suite"
          />
        </div>
      </div>

      {/* ── SDG COMMITMENT BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0A4A2E, #0D5C35)',
        borderRadius: 20, padding: '28px 32px',
        border: '1px solid rgba(201,168,76,0.2)',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 20,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: '40%',
          background: 'radial-gradient(ellipse at right, rgba(201,168,76,0.07), transparent)',
          pointerEvents: 'none'
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 560 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Sprout size={20} style={{ color: '#4DB870' }} />
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              color: '#FFFFFF', fontWeight: 700, fontSize: '1.1rem'
            }}>
              Committed to Sustainable Agriculture
            </h3>
          </div>
          <p style={{ color: 'rgba(184,229,200,0.8)', fontSize: '0.83rem', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
            AgriMind prioritises Integrated Pest Management (IPM), micro-irrigation efficiency, organic soil enrichment,
            and judicious fertilizer application aligned with United Nations Sustainable Development Goals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, position: 'relative', zIndex: 1 }}>
          {[{ code: 'SDG 2', label: 'Zero Hunger' }, { code: 'SDG 12', label: 'Responsible Consumption' }].map(sdg => (
            <div key={sdg.code} style={{
              padding: '14px 18px', borderRadius: 14,
              background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(201,168,76,0.3)', textAlign: 'center', minWidth: 110
            }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                UN {sdg.code}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF' }}>{sdg.label}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
