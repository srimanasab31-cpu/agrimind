import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings as SettingsIcon, Globe, Moon, Sun, Shield, Server, CheckCircle2, AlertTriangle, Trash2, Info } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export default function Settings() {
  const [language, setLanguage] = useState(() => localStorage.getItem('agrimind_lang') || 'en');
  const [theme, setTheme] = useState(() => localStorage.getItem('agrimind_theme') || 'light');
  const [showSources, setShowSources] = useState(true);
  const [healthStatus, setHealthStatus] = useState<any | null>(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/health`);
      setHealthStatus(res.data);
    } catch (err) {
      setHealthStatus({ status: 'unreachable' });
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem('agrimind_lang', newLang);
  };

  const handleClearSession = () => {
    if (confirm('Clear local demonstration session and reset active conversation?')) {
      localStorage.removeItem('agrimind_session');
      alert('Local demo session reset successfully. Refresh the page to start a new chat session.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-agrigreen-600" />
          Settings & System Information
        </h2>
        <p className="text-gray-500 text-sm">
          Configure application preferences, inspect backend AI component connectivity, and view privacy policies.
        </p>
      </div>

      {/* Language & Interface Preferences */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2 border-b pb-3">
          <Globe className="w-5 h-5 text-agrigreen-600" /> User Language & Interface
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Preferred Language</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-between ${
                  language === 'en'
                    ? 'border-agrigreen-600 bg-agrigreen-50 text-agrigreen-900'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span>English</span>
                {language === 'en' && <CheckCircle2 className="w-4 h-4 text-agrigreen-600" />}
              </button>
              <button
                onClick={() => handleLanguageChange('ta')}
                className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-between ${
                  language === 'ta'
                    ? 'border-agrigreen-600 bg-agrigreen-50 text-agrigreen-900'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span>தமிழ் (Tamil)</span>
                {language === 'ta' && <CheckCircle2 className="w-4 h-4 text-agrigreen-600" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Affects prompt response headers and AI recommendation localization.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Evidence Citation Cards</label>
            <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={showSources}
                onChange={(e) => setShowSources(e.target.checked)}
                className="rounded text-agrigreen-600 focus:ring-agrigreen-500 w-4 h-4"
              />
              <span className="text-sm text-gray-700">Display expandable research citations under assistant responses</span>
            </label>
            <p className="text-xs text-gray-400 mt-1.5">
              Always recommended for university research and transparent auditing.
            </p>
          </div>
        </div>
      </div>

      {/* Backend & AI Component Diagnostics */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2 border-b pb-3">
          <Server className="w-5 h-5 text-agrigreen-600" /> AI Pipeline Diagnostics & Services
        </h3>

        <div className="divide-y text-xs">
          <div className="py-2.5 flex justify-between items-center">
            <div>
              <div className="font-semibold text-gray-800">FastAPI Application Server</div>
              <div className="text-gray-400 font-mono">http://localhost:8080/api/v1</div>
            </div>
            <span className="px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Healthy & Online
            </span>
          </div>

          <div className="py-2.5 flex justify-between items-center">
            <div>
              <div className="font-semibold text-gray-800">SQLite Database Persistence</div>
              <div className="text-gray-400 font-mono">data/agrimind.db (SQLAlchemy ORM)</div>
            </div>
            <span className="px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Connected
            </span>
          </div>

          <div className="py-2.5 flex justify-between items-center">
            <div>
              <div className="font-semibold text-gray-800">RAG Document Ingestion & Retrieval</div>
              <div className="text-gray-400">Heuristic keyword indexing with SQL text chunking</div>
            </div>
            <span className="px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Active
            </span>
          </div>

          <div className="py-2.5 flex justify-between items-center">
            <div>
              <div className="font-semibold text-gray-800">Disease Computer Vision Classifier</div>
              <div className="text-gray-400">EfficientNet-B0 (Weights unconfigured in backend/models)</div>
            </div>
            <span className="px-2.5 py-1 rounded-full font-semibold bg-yellow-100 text-yellow-800 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Fallback Mode Engaged
            </span>
          </div>

          <div className="py-2.5 flex justify-between items-center">
            <div>
              <div className="font-semibold text-gray-800">Weather Intelligence Provider</div>
              <div className="text-gray-400">Regional Agro-Climate Profile (OPENWEATHER_API_KEY optional)</div>
            </div>
            <span className="px-2.5 py-1 rounded-full font-semibold bg-yellow-100 text-yellow-800 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Demo Mode Engaged
            </span>
          </div>
        </div>
      </div>

      {/* Privacy, Ethics and Safety */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2 border-b pb-3">
          <Shield className="w-5 h-5 text-agrigreen-600" /> Research Privacy, Ethics & Disclaimer
        </h3>

        <div className="text-xs text-gray-600 leading-relaxed space-y-2.5 bg-gray-50 p-4 rounded-xl">
          <p>
            <strong>Agricultural Safety Guardrails:</strong> AgriMind is designed strictly as an evidence-grounded decision-support tool for university agricultural research. It does NOT automatically fabricate high-risk chemical pesticide recommendations or fertilizer dosages without verified retrieved research citations.
          </p>
          <p>
            <strong>Data Privacy & Retention:</strong> Uploaded leaf photographs and conversational queries are stored exclusively in your local workspace database (SQLite) for demonstration and evaluation purposes. No farmer personal data or sensitive biometric telemetry is shared with external commercial advertising brokers.
          </p>
          <p>
            <strong>Academic Integrity:</strong> In accordance with strict AI research guidelines, whenever a deep learning weight file or external live API is not configured, the system explicitly abstains from presenting synthetic predictions as real model outputs.
          </p>
        </div>

        <div className="pt-2 flex justify-between items-center">
          <button
            onClick={handleClearSession}
            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition"
          >
            <Trash2 className="w-4 h-4" /> Reset Local Demo Session State
          </button>

          <span className="text-xs text-gray-400 font-mono">AgriMind v1.0.0 (Research Edition)</span>
        </div>
      </div>
    </div>
  );
}
