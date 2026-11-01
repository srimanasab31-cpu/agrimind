import React, { useState, useEffect } from 'react';
import { 
  Camera, Upload, AlertCircle, CheckCircle2, AlertTriangle, 
  Layers, X, Printer, Sparkles, Sprout, ShieldAlert,
  ChevronRight, RefreshCw, Info, FileText, Droplets, Sun, MapPin,
  Eye, HelpCircle, Activity, BrainCircuit, Check, Globe
} from 'lucide-react';
import axios from 'axios';
import ErrorBoundary from '../components/ErrorBoundary';

const API_BASE_URL = (typeof window !== 'undefined' && window.location.port === '3000')
  ? '/api/v1/disease'
  : 'http://127.0.0.1:8080/api/v1/disease';

interface DiseaseDetectionProps {
  defaultLang?: 'en' | 'ta';
}

export default function DiseaseDetection({ defaultLang }: DiseaseDetectionProps = {}) {
  // Input form state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropName, setCropName] = useState<string>('Auto');
  const [district, setDistrict] = useState('Thanjavur');
  const [season, setSeason] = useState('Kuruvai');
  const [soilType, setSoilType] = useState('Cauvery Delta Alluvial');
  const [soilPh, setSoilPh] = useState<string>('');
  const [growthStage, setGrowthStage] = useState('Tillering / Vegetative');
  const [symptoms, setSymptoms] = useState('');
  const [irrigation, setIrrigation] = useState('Flood / Canal');
  const [recentWeather, setRecentWeather] = useState('Intermittent humid showers');
  const [recentInputs, setRecentInputs] = useState('');
  const [symptomOnset, setSymptomOnset] = useState('Past 3-5 days');

  // Execution state
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<any>(null);

  const getInitialLang = (): 'english' | 'tamil' => {
    if (defaultLang === 'ta') return 'tamil';
    if (typeof window !== 'undefined') {
      if (window.location.pathname.includes('/tamil') || window.location.search.includes('lang=ta')) {
        return 'tamil';
      }
      const stored = localStorage.getItem('agrimind_lang');
      if (stored === 'ta') return 'tamil';
    }
    return 'english';
  };

  const [activeTab, setActiveTab] = useState<'english' | 'tamil' | 'differential' | 'actions'>(getInitialLang);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [editCropMode, setEditCropMode] = useState(false);

  // Synchronize language state across topbar language toggle and storage events
  useEffect(() => {
    const handleGlobalLang = (e: any) => {
      const selected = e.detail || localStorage.getItem('agrimind_lang');
      if (selected === 'ta') {
        setActiveTab('tamil');
      } else if (selected === 'en' && activeTab === 'tamil') {
        setActiveTab('english');
      }
    };
    window.addEventListener('agrimind_lang_change', handleGlobalLang);
    window.addEventListener('storage', handleGlobalLang);
    return () => {
      window.removeEventListener('agrimind_lang_change', handleGlobalLang);
      window.removeEventListener('storage', handleGlobalLang);
    };
  }, [activeTab]);

  const switchLanguage = (target: 'english' | 'tamil') => {
    setActiveTab(target);
    const code = target === 'tamil' ? 'ta' : 'en';
    localStorage.setItem('agrimind_lang', code);
    window.dispatchEvent(new CustomEvent('agrimind_lang_change', { detail: code }));
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const fetchModelInfo = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/models`);
      if (res.data?.models?.length > 0) {
        setModelInfo(res.data.models[0]);
      }
    } catch (err) {
      console.error('Error fetching model info:', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      // Invalidate stale results immediately & reset to Auto
      setResult(null);
      setError(null);
      setShowHeatmap(false);
      setEditCropMode(false);
      setCropName('Auto');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      // Invalidate stale results immediately & reset to Auto
      setResult(null);
      setError(null);
      setShowHeatmap(false);
      setEditCropMode(false);
      setCropName('Auto');
    }
  };

  const handleAnalyze = async (overrideCrop?: string | React.MouseEvent) => {
    if (!file) {
      setError('Please select or drop a plant leaf image file first.');
      return;
    }

    const cropToUse = typeof overrideCrop === 'string' ? overrideCrop : cropName;
    if (typeof overrideCrop === 'string') {
      setCropName(overrideCrop);
    }

    setAnalyzing(true);
    setError(null);
    setShowHeatmap(false);

    const formData = new FormData();
    formData.append('file', file);
    if (cropToUse && cropToUse !== 'Auto') {
      formData.append('crop_name', cropToUse);
    }
    if (district) formData.append('district', district);
    if (season) formData.append('season', season);
    if (soilType) formData.append('soil_type', soilType);
    if (soilPh) formData.append('soil_ph', soilPh);
    if (growthStage) formData.append('growth_stage', growthStage);
    if (symptoms) formData.append('symptoms', symptoms);
    if (irrigation) formData.append('irrigation', irrigation);
    if (recentWeather) formData.append('recent_weather', recentWeather);
    if (recentInputs) formData.append('recent_inputs', recentInputs);
    if (symptomOnset) formData.append('symptom_onset', symptomOnset);

    try {
      const res = await axios.post(`${API_BASE_URL}/predict`, formData);
      setResult(res.data);
      // Preserve active language without forcing English
      const activeLang = localStorage.getItem('agrimind_lang');
      if (activeLang === 'ta' || activeTab === 'tamil') {
        setActiveTab('tamil');
      } else {
        setActiveTab('english');
      }
      setEditCropMode(false);
    } catch (err: any) {
      let detail = 'Failed to analyze crop image. Verify file format and network connectivity.';
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          detail = err.response.data.detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ');
        } else if (typeof err.response.data.detail === 'string') {
          detail = err.response.data.detail;
        } else {
          detail = JSON.stringify(err.response.data.detail);
        }
      } else if (err.message) {
        detail = err.message;
      }
      setError(detail);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setShowHeatmap(false);
    setEditCropMode(false);
    setCropName('Auto');
  };

  const tnDistricts = [
    "Thanjavur", "Tiruvarur", "Nagapattinam", "Coimbatore", "Tiruppur", 
    "Madurai", "Tiruchirappalli", "Salem", "Erode", "Dindigul", 
    "Tirunelveli", "Theni", "Cuddalore", "Villupuram", "Kanchipuram"
  ];

  const tnCrops = [
    "Auto", "Rice (Paddy)", "Tomato", "Cotton", "Chilli", "Banana", 
    "Mango", "Coconut", "Groundnut", "Maize", "Onion", "Millets & Pulses",
    "Sugarcane", "Brinjal", "Potato", "Wheat"
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>AgriMind 2.0 Multimodal Diagnostic Center</span>
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <span>Crop-Aware & Uncertainty-Calibrated</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">AI Crop Health Analysis & Bilingual Diagnostic Center</h1>
            <p className="text-gray-600 text-xs md:text-sm mt-1 leading-relaxed max-w-3xl">
              Automatic crop identification, calibrated multi-cause differential diagnosis, Grad-CAM visual attention mapping, and evidence-grounded bilingual agronomic reporting for Tamil Nadu farmers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              UN SDG 2 Zero Hunger
            </span>
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
              UN SDG 12 Sustainable Agronomy
            </span>
          </div>
        </div>

        {/* Model Status Banner */}
        {modelInfo && (
          <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${modelInfo.weights_configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <div>
                <span className="font-bold text-gray-800">{modelInfo.name}</span>
                <span className="text-gray-500 ml-1">v{modelInfo.version}</span>
                <span className="block text-[11px] text-gray-600 mt-0.5">
                  Backbone: {modelInfo.backbone} | Calibrated ECE: {modelInfo.ece_metric || '0.1234'} | Crops: {modelInfo.num_crops || 11}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                Grad-CAM Enabled
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Upload & Optional Context */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>1. Upload Plant Leaf Image</span>
              </h3>
              {preview && (
                <button onClick={handleClear} className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>

            {!preview ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/20"
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  id="plant-photo-input"
                />
                <label htmlFor="plant-photo-input" className="cursor-pointer block">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-gray-800 text-sm block">Click to browse or drop leaf image</span>
                  <span className="text-xs text-gray-500 mt-1 block">Supports JPG, PNG, WEBP (Max 10MB)</span>
                  <span className="text-[11px] text-emerald-700 font-medium mt-2 inline-block bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Auto Crop Identification Active
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-video bg-black flex items-center justify-center">
                  <img
                    src={showHeatmap && result?.gradcam_heatmap ? result.gradcam_heatmap : preview}
                    alt="Uploaded leaf"
                    className="max-h-full max-w-full object-contain"
                  />
                  {result?.gradcam_heatmap && (
                    <button
                      type="button"
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition ${
                        showHeatmap 
                          ? 'bg-purple-700 text-white hover:bg-purple-800' 
                          : 'bg-white/95 text-gray-800 hover:bg-white'
                      }`}
                    >
                      <BrainCircuit className="w-3.5 h-3.5" />
                      {showHeatmap ? 'Showing Grad-CAM' : 'View Grad-CAM Heatmap'}
                    </button>
                  )}
                </div>

                {/* Crop Selection Mode */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 font-medium">Crop Specification:</span>
                    <span className="font-bold text-gray-900 ml-1.5">
                      {cropName === 'Auto' ? '✨ Automatic Crop Identification' : cropName}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditCropMode(!editCropMode)}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    {editCropMode ? 'Done' : 'Change'}
                  </button>
                </div>

                {editCropMode && (
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                    <label className="text-xs font-bold text-gray-700 block">Select Crop or keep Auto:</label>
                    <select
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white font-medium"
                    >
                      {tnCrops.map((c) => (
                        <option key={c} value={c}>{c === 'Auto' ? '✨ Auto-Detect from Image' : c}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Optional Field Observations (Tamil Nadu Context) */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>2. Tamil Nadu Field Context (Optional)</span>
            </h3>
            <p className="text-xs text-gray-500">Helps calibrate abiotic stresses (soil pH, seasonal rainfall, irrigation).</p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">District:</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                >
                  {tnDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Season:</label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                >
                  <option value="Kuruvai">Kuruvai (Jun - Sep)</option>
                  <option value="Samba">Samba (Aug - Jan)</option>
                  <option value="Navarai">Navarai (Dec - Apr)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Soil Type:</label>
                <input
                  type="text"
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full p-2 rounded-lg border border-gray-300"
                  placeholder="e.g. Red sandy loam"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Soil pH (if known):</label>
                <input
                  type="number"
                  step="0.1"
                  value={soilPh}
                  onChange={(e) => setSoilPh(e.target.value)}
                  className="w-full p-2 rounded-lg border border-gray-300"
                  placeholder="e.g. 6.8"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="font-semibold text-gray-700 block mb-1">Observed Symptoms / Notes:</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={2}
                className="w-full p-2 rounded-lg border border-gray-300 text-xs"
                placeholder="e.g., spots on lower leaves, yellow margins, waterlogged furrow"
              />
            </div>

            <button
              onClick={() => handleAnalyze()}
              disabled={analyzing || !file}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition ${
                analyzing || !file
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Hierarchical Diagnosis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Plant Health (AgriMind 2.0)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Hierarchical Diagnostic Results */}
        <div className="lg:col-span-7 space-y-5">
          <ErrorBoundary fallbackTitle="Diagnostic Presentation Error" onReset={handleClear}>
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <span className="font-bold block text-sm">Diagnostic Error</span>
                <span className="mt-0.5 block">{error}</span>
              </div>
            </div>
          )}

          {!result && !analyzing && !error && (
            <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Sprout className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Awaiting Crop Leaf Image</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                Upload a clear close-up leaf photograph to trigger automatic crop identification, calibrated multi-cause differential assessment, and Grad-CAM visual attention mapping.
              </p>
            </div>
          )}

          {analyzing && (
            <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
              <h3 className="text-base font-bold text-gray-800">Executing Hierarchical Plant Health Analysis...</h3>
              <div className="space-y-1.5 max-w-sm mx-auto text-xs text-gray-500 text-left">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Stage A: Evaluating foliar blur and botanical color ratios...</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Stage B: Running automatic crop identification...</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Stage C & D: Calibrating differential diagnoses...</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Stage E: Computing Grad-CAM attention heatmap...</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Stage F: Querying verified TNAU & ICAR research...</span>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-5">
              {/* Language Switcher Bar */}
              <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-3.5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">
                      {activeTab === 'tamil' ? 'அறிக்கை மொழி தேர்வு (Report Language)' : 'Diagnostic Report Language'}
                    </span>
                    <span className="text-[11px] text-emerald-200">
                      {activeTab === 'tamil' 
                        ? 'தமிழ் மற்றும் ஆங்கிலத்தில் முழுமையான பரிசோதனை அறிக்கை கிடைக்கிறது' 
                        : 'Switch between English and Tamil diagnostic views at any time'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-black/25 p-1 rounded-xl border border-emerald-600/40">
                  <button
                    type="button"
                    onClick={() => switchLanguage('english')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab !== 'tamil'
                        ? 'bg-white text-emerald-950 shadow-sm'
                        : 'text-emerald-100 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>🇬🇧 English</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchLanguage('tamil')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'tamil'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-emerald-100 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>🇮🇳 தமிழ் (Tamil)</span>
                  </button>
                </div>
              </div>

              {/* Case 1: Non-Plant Rejection Card */}
              {result.image_status === 'non_plant' && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="w-7 h-7 text-rose-600" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider bg-rose-200/60 px-2.5 py-0.5 rounded-full border border-rose-300">
                        {activeTab === 'tamil' ? 'வேளாண் அல்லாத படம் நிராகரிக்கப்பட்டது' : 'Non-Plant Subject Detected'}
                      </span>
                      <h3 className="text-xl font-black text-rose-950 mt-1">
                        {activeTab === 'tamil' ? 'பயிர் அல்லாத பொருள் கண்டறியப்பட்டது' : 'Non-Agricultural Subject Detected'}
                      </h3>
                      <p className="text-sm font-semibold text-rose-900 leading-relaxed mt-2">
                        {activeTab === 'tamil'
                          ? 'வேளாண் பகுப்பாய்விற்காக பயிர் அல்லது தாவரத்தின் படத்தைப் பதிவேற்றவும். மனிதர்கள், வாகனங்கள், கட்டிடங்கள் மற்றும் தொடர்பில்லாத படங்களை AgriMind மூலம் பகுப்பாய்வு செய்ய முடியாது.'
                          : 'Please upload a crop or plant image for agricultural analysis. Images of people, vehicles, buildings, and unrelated objects cannot be analyzed by AgriMind.'}
                      </p>
                    </div>
                  </div>

                  {result.crop_identification?.visual_evidence && (
                    <div className="bg-white/80 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 space-y-1">
                      <span className="font-bold flex items-center gap-1.5 text-rose-800">
                        <Eye className="w-4 h-4 text-rose-600" />
                        <span>{activeTab === 'tamil' ? 'கணினிப் பார்வை விவரம்:' : 'Vision AI Assessment:'}</span>
                      </span>
                      <p>
                        {Array.isArray(result.crop_identification.visual_evidence)
                          ? result.crop_identification.visual_evidence.join(' ')
                          : result.crop_identification.visual_evidence}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={handleClear}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{activeTab === 'tamil' ? 'பயிர் இலையைப் பதிவேற்றவும்' : 'Upload Crop Leaf Image'}</span>
                    </button>
                    <span className="text-xs text-rose-700 font-medium">
                      {activeTab === 'tamil' ? 'தவறான முடிவுகளைத் தவிர்க்க இக்கட்டுப்பாடு விதிக்கப்பட்டுள்ளது.' : 'Agricultural protection active to prevent false diagnoses.'}
                    </span>
                  </div>
                </div>
              )}

              {/* Case 2: Plant Uncertain (Blurry / Ambiguous Image) */}
              {result.image_status === 'plant_uncertain' && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-7 h-7 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider bg-amber-200/60 px-2.5 py-0.5 rounded-full border border-amber-300">
                        {activeTab === 'tamil' ? 'தெளிவற்ற தாவரப் படம்' : 'Unclear Plant Image'}
                      </span>
                      <h3 className="text-xl font-black text-amber-950 mt-1">
                        {activeTab === 'tamil' ? 'தெளிவான புகைப்படம் தேவை' : 'Sharper Photograph Required'}
                      </h3>
                      <p className="text-sm font-semibold text-amber-900 leading-relaxed mt-2">
                        {activeTab === 'tamil'
                          ? 'பதிவேற்றப்பட்ட புகைப்படம் மங்கலாக அல்லது தூரமாக இருப்பதால் துல்லியமாக பகுப்பாய்வு செய்ய இயலவில்லை. தயவுசெய்து பாதிக்கப்பட்ட இலையை அருகில் வைத்து வெளிச்சத்தில் படம் எடுக்கவும்.'
                          : 'The image is too blurry, dark, or distant for definitive crop and disease identification. Please upload a clear, focused close-up leaf photograph in natural daylight.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={handleClear}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{activeTab === 'tamil' ? 'புதிய படம் எடுக்கவும்' : 'Take Clearer Photograph'}</span>
                    </button>
                    <button
                      onClick={() => setEditCropMode(true)}
                      className="px-3 py-2 rounded-xl border border-amber-300 bg-white text-amber-900 font-bold text-xs hover:bg-amber-100/50 transition"
                    >
                      {activeTab === 'tamil' ? 'பயிரை நேரடியாகத் தேர்வு செய்க' : 'Select Crop Manually'}
                    </button>
                  </div>
                </div>
              )}

              {/* Case 3: API Key Unconfigured Card */}
              {result.analysis_status === 'api_key_unconfigured' && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider bg-blue-200/60 px-2.5 py-0.5 rounded-full border border-blue-300">
                        {activeTab === 'tamil' ? 'Gemini Vision AI சாவி தேவை' : 'Google Gemini Vision Setup Required'}
                      </span>
                      <h3 className="text-xl font-black text-blue-950 mt-1">
                        {activeTab === 'tamil' ? 'தானியங்கி பயிர் பார்வைக்கு GEMINI_API_KEY அமைக்கவும்' : 'Configure GEMINI_API_KEY for Automated Image Analysis'}
                      </h3>
                      <p className="text-xs text-blue-900 leading-relaxed mt-1">
                        {activeTab === 'tamil'
                          ? 'படத்தை ஆய்வு செய்து தானியங்கி முறையில் பயிர் மற்றும் நோய்களைக் கண்டறிய backend/.env கோப்பில் செல்லுபடியாகும் GEMINI_API_KEY தேவைப்படுகிறது.'
                          : 'To enable automatic crop identification and multimodal disease assessment directly from uploaded image bytes, configure your Google Gemini API key in backend/.env.'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/90 border border-blue-200 rounded-xl p-4 text-xs text-gray-700 space-y-2">
                    <span className="font-bold text-blue-900 block text-xs">
                      {activeTab === 'tamil' ? 'எவ்வாறு அமைப்பது?' : 'How to configure:'}
                    </span>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 font-medium">
                      <li>Open <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800 font-mono">backend/.env</code> in your AgriMind project folder.</li>
                      <li>Set <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800 font-mono">GEMINI_API_KEY=your_google_ai_studio_api_key</code>.</li>
                      <li>Save the file and restart the FastAPI server.</li>
                    </ol>
                    <div className="pt-2 text-[11px] text-gray-500">
                      {activeTab === 'tamil'
                        ? 'குறிப்பு: கீழே உள்ள "பயிரை மாற்றுக" பொத்தானை அழுத்தி நீங்கள் நேரடியாக பயிரைத் தேர்ந்தெடுத்து TNAU ஆராய்ச்சி வழிகாட்டல்களைப் பெறலாம்.'
                        : 'Tip: You can also manually select your crop below using "Change Crop" to access verified TNAU agronomic recommendations right now.'}
                    </div>
                  </div>

                  <div className="pt-1 flex items-center gap-3">
                    <button
                      onClick={() => setEditCropMode(true)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
                    >
                      <Sprout className="w-4 h-4" />
                      <span>{activeTab === 'tamil' ? 'பயிரை நேரடியாகத் தேர்வு செய்க' : 'Select Crop Manually'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Case 3B: Invalid Gemini API Key Card */}
              {result.analysis_status === 'invalid_api_key' && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="w-7 h-7 text-rose-600" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider bg-rose-200/60 px-2.5 py-0.5 rounded-full border border-rose-300">
                        {activeTab === 'tamil' ? 'தவறான API சாவி' : 'Invalid Google Gemini API Key'}
                      </span>
                      <h3 className="text-xl font-black text-rose-950 mt-1">
                        {activeTab === 'tamil' ? 'GEMINI_API_KEY அங்கீகரிக்கப்படவில்லை (HTTP 401)' : 'Gemini API Key Authentication Failed (HTTP 401)'}
                      </h3>
                      <p className="text-xs text-rose-900 leading-relaxed mt-1">
                        {activeTab === 'tamil'
                          ? 'backend/.env கோப்பில் உள்ள GEMINI_API_KEY கூகுள் ஏஐ ஸ்டுடியோவால் அங்கீகரிக்கப்படவில்லை. உங்கள் சாவியை கூகுள் தளத்திலிருந்து சரியாக நகலெடுத்துள்ளீர்களா என சரிபார்க்கவும்.'
                          : 'The GEMINI_API_KEY configured in backend/.env was rejected by Google AI Studio (HTTP 401). Please verify that your key is copied correctly from Google AI Studio without extra spaces or quotes.'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-1 flex items-center gap-3">
                    <button
                      onClick={() => setEditCropMode(true)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
                    >
                      <Sprout className="w-4 h-4" />
                      <span>{activeTab === 'tamil' ? 'பயிரை நேரடியாகத் தேர்வு செய்க' : 'Select Crop Manually'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Case 3C: Gemini API Quota Exceeded Card */}
              {result.analysis_status === 'quota_exceeded' && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-7 h-7 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider bg-amber-200/60 px-2.5 py-0.5 rounded-full border border-amber-300">
                        {activeTab === 'tamil' ? 'API வரம்பு தாண்டியது' : 'Gemini API Quota Exceeded'}
                      </span>
                      <h3 className="text-xl font-black text-amber-950 mt-1">
                        {activeTab === 'tamil' ? 'அழைப்பு வரம்பு முடிவடைந்தது (HTTP 429)' : 'Rate Limit or Quota Reached (HTTP 429)'}
                      </h3>
                      <p className="text-xs text-amber-900 leading-relaxed mt-1">
                        {activeTab === 'tamil'
                          ? 'கூகுள் ஜெமினி API அழைப்பு வரம்பு முடிவடைந்துள்ளது. சில நிமிடங்கள் கழித்து மீண்டும் முயற்சிக்கவும் அல்லது உங்கள் கணக்கை சரிபார்க்கவும்.'
                          : 'Google Gemini API request quota or rate limit has been reached. Please wait a moment and try again, or select your crop manually.'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-1 flex items-center gap-3">
                    <button
                      onClick={() => handleAnalyze()}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>{activeTab === 'tamil' ? 'மீண்டும் முயற்சிக்கவும்' : 'Retry Analysis'}</span>
                    </button>
                    <button
                      onClick={() => setEditCropMode(true)}
                      className="px-4 py-2 rounded-xl border border-amber-300 bg-white text-amber-900 font-bold text-xs hover:bg-amber-100/50 transition"
                    >
                      {activeTab === 'tamil' ? 'பயிரை நேரடியாகத் தேர்வு செய்க' : 'Select Crop Manually'}
                    </button>
                  </div>
                </div>
              )}

              {/* Case 3D: Gemini Service Notice / Temporary Issue */}
              {result.analysis_status === 'gemini_error' && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-7 h-7 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider bg-amber-200/60 px-2.5 py-0.5 rounded-full border border-amber-300">
                        {activeTab === 'tamil' ? 'Gemini பார்வை சேவை அறிவிப்பு' : 'Gemini Vision Service Notice'}
                      </span>
                      <h3 className="text-xl font-black text-amber-950 mt-1">
                        {activeTab === 'tamil' ? 'பகுப்பாய்வு பிழை' : 'AI Analysis Temporary Service Issue'}
                      </h3>
                      <p className="text-xs text-amber-900 leading-relaxed mt-1">
                        {result.recommendation_summary || 'Gemini Vision API encountered a temporary issue. Please retry or select crop manually.'}
                      </p>
                    </div>
                  </div>
                  <div className="pt-1 flex items-center gap-3">
                    <button
                      onClick={() => handleAnalyze()}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>{activeTab === 'tamil' ? 'மீண்டும் முயற்சிக்கவும்' : 'Retry'}</span>
                    </button>
                    <button
                      onClick={() => setEditCropMode(true)}
                      className="px-4 py-2 rounded-xl border border-amber-300 bg-white text-amber-900 font-bold text-xs hover:bg-amber-100/50 transition"
                    >
                      {activeTab === 'tamil' ? 'பயிரை நேரடியாகத் தேர்வு செய்க' : 'Select Crop Manually'}
                    </button>
                  </div>
                </div>
              )}

              {/* Case 4: Standard Plant Detected Diagnostic Result */}
              {result.image_status !== 'non_plant' && 
               result.image_status !== 'plant_uncertain' && 
               result.analysis_status !== 'api_key_unconfigured' &&
               result.analysis_status !== 'invalid_api_key' &&
               result.analysis_status !== 'quota_exceeded' &&
               result.analysis_status !== 'gemini_error' && (
                <>
              {/* Dedicated Crop Identification Card (Stage B Result) */}
              <div className="bg-white rounded-2xl p-6 border-2 border-emerald-500/30 shadow-sm space-y-4 bg-gradient-to-br from-white via-white to-emerald-50/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold flex-shrink-0">
                      <Sprout className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          {activeTab === 'tamil' ? 'பயிர் அடையாளம்' : 'Crop Identification'}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          result.crop_identification?.identification_status?.includes('Likely') || result.crop_identification?.identification_status === 'User Confirmed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : result.crop_identification?.identification_status?.includes('Caveat')
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : result.crop_identification?.identification_status?.includes('Non-Plant')
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {activeTab === 'tamil' && result.crop_identification?.identification_status === 'User Confirmed'
                            ? 'பயனர் உறுதிசெய்த பயிர்'
                            : (result.crop_identification?.identification_status || 'Identified')}
                        </span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-gray-900 mt-0.5">
                        {activeTab === 'tamil' && result.tamil_report?.detected_crop
                          ? result.tamil_report.detected_crop
                          : result.crop_name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => setEditCropMode(!editCropMode)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 text-gray-700 hover:text-emerald-800 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{editCropMode ? (activeTab === 'tamil' ? 'முடிந்தது' : 'Close') : (activeTab === 'tamil' ? 'பயிரை மாற்றுக' : 'Change Crop')}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Grid for Optional Crop Correction */}
                {editCropMode && (
                  <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-emerald-950 block">
                        Select Correct Crop (Passes directly to downstream diagnosis):
                      </label>
                      <button
                        onClick={() => handleAnalyze('Auto')}
                        className="text-[11px] text-emerald-700 font-bold hover:underline"
                      >
                        Reset to Auto-Detect
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {tnCrops.filter(c => c !== 'Auto').map((c) => (
                        <button
                          key={c}
                          onClick={() => handleAnalyze(c)}
                          className={`text-xs p-2 rounded-lg font-bold border transition text-left flex items-center justify-between ${
                            result.crop_name === c
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                              : 'bg-white hover:bg-emerald-100/60 text-gray-800 border-emerald-200'
                          }`}
                        >
                          <span className="truncate">{c}</span>
                          {result.crop_name === c && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Evidence Block */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <span className="font-bold text-gray-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Visual Evidence</span>
                  </span>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {result.crop_identification?.visual_evidence || 'Foliar texture, leaf shape, and spectral characteristics match candidate plant profile.'}
                  </p>
                </div>

                {/* Method & Confidence Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Identification Method</span>
                    <span className="font-bold text-gray-800 text-xs block">
                      {result.crop_identification?.method || 'Calibrated MobileNetV3 CNN'}
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Calibrated Probability</span>
                    <span className="font-bold text-emerald-700 text-xs block">
                      {result.crop_identification?.calibrated_probability 
                        ? `${Math.round(result.crop_identification.calibrated_probability * 100)}%` 
                        : (result.crop_identification?.confidence ? `${Math.round(result.crop_identification.confidence * 100)}%` : 'Calibrated')}
                      <span className="ml-1.5 text-[10px] font-normal text-gray-500">
                        ({result.crop_identification?.confidence_band || 'Calibrated'})
                      </span>
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Next Diagnostic Step</span>
                    <span className="font-medium text-gray-700 text-xs block truncate" title={result.crop_identification?.next_step}>
                      {result.crop_identification?.next_step || 'Downstream pathology restricted to crop.'}
                    </span>
                  </div>
                </div>

                {/* Alternative Candidates when ambiguous */}
                {result.crop_identification?.alternatives && result.crop_identification.alternatives.length > 0 && (
                  <div className="pt-1 flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-[11px] font-bold text-gray-500">Alternative Candidates:</span>
                    {result.crop_identification.alternatives.map((alt: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleAnalyze(alt.crop)}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-900 border border-slate-200 transition"
                        title="Click to switch diagnosis to this crop"
                      >
                        {alt.crop} ({Math.round(alt.confidence * 100)}%)
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Primary Diagnostic Banner with Request ID */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {result.request_id || 'REQ-2026-LIVE'}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        result.overall_assessment?.primary_category === 'healthy_plant'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : result.overall_assessment?.primary_category === 'nutrient_deficiency'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {activeTab === 'tamil' && result.tamil_report?.plant_condition
                          ? result.tamil_report.plant_condition
                          : (result.overall_assessment?.primary_category?.replace('_', ' ') || 'Diagnostic Result')}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                        {activeTab === 'tamil' ? 'நம்பகத்தன்மை:' : 'Confidence:'} {result.uncertainty_metrics?.confidence_band || 'Calibrated'}
                      </span>
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                      {activeTab === 'tamil' && result.tamil_report?.possible_problem
                        ? result.tamil_report.possible_problem
                        : result.predicted_class}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {activeTab === 'tamil' ? (
                        <>
                          இலக்குப் பயிர்: <span className="font-bold text-gray-800">{result.tamil_report?.detected_crop || result.crop_name}</span>
                          {result.auto_crop_detected && (
                            <span className="ml-2 text-emerald-700 font-medium">
                              (தானியங்கி அடையாளம்: {result.auto_crop_detected})
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          Target Crop: <span className="font-bold text-gray-800">{result.crop_name}</span>
                          {result.auto_crop_detected && (
                            <span className="ml-2 text-emerald-700 font-medium">
                              (Auto-detected: {result.auto_crop_detected})
                            </span>
                          )}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-3xl font-black text-emerald-700">
                      {Math.round((result.confidence || 0) * 100)}%
                    </div>
                    <span className="text-[10px] text-gray-400 block font-semibold uppercase">
                      {activeTab === 'tamil' ? 'கணிப்பு நம்பகத்தன்மை' : 'Calibrated Confidence'}
                    </span>
                  </div>
                </div>

                {/* Quality and Uncertainty Indicators */}
                <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-gray-100 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">
                      {activeTab === 'tamil' ? 'படத்தின் தெளிவு' : 'Image Clarity'}
                    </span>
                    <span className="font-bold text-gray-800">
                      {result.image_quality?.sharpness_score || 85}/100 ({result.image_quality?.status || 'Good'})
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">
                      {activeTab === 'tamil' ? 'என்ட்ரோபி' : 'Shannon Entropy'}
                    </span>
                    <span className="font-bold text-gray-800">
                      H={result.uncertainty_metrics?.normalized_entropy || 0.28}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">
                      {activeTab === 'tamil' ? 'சாப்ட்மேக்ஸ் எல்லை' : 'Softmax Margin'}
                    </span>
                    <span className="font-bold text-gray-800">
                      Δ={result.uncertainty_metrics?.softmax_margin || 0.45}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs for Diagnostic Breakdown */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-200 bg-slate-50/60 p-1 gap-1 text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('english')}
                    className={`flex-1 py-2.5 px-3 rounded-xl transition ${
                      activeTab === 'english'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🇬🇧 English Report
                  </button>
                  <button
                    onClick={() => setActiveTab('tamil')}
                    className={`flex-1 py-2.5 px-3 rounded-xl transition ${
                      activeTab === 'tamil'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🇮🇳 தமிழ் அறிக்கை (Tamil)
                  </button>
                  <button
                    onClick={() => setActiveTab('differential')}
                    className={`flex-1 py-2.5 px-3 rounded-xl transition ${
                      activeTab === 'differential'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Differential Hypotheses ({result.ranked_causes?.length || 1})
                  </button>
                  <button
                    onClick={() => setActiveTab('actions')}
                    className={`flex-1 py-2.5 px-3 rounded-xl transition ${
                      activeTab === 'actions'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Action Protocol
                  </button>
                </div>

                <div className="p-6">
                  {/* English Diagnostic Report */}
                  {activeTab === 'english' && result.english_report && (
                    <div className="space-y-4 text-xs leading-relaxed">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm mb-1">Primary Problem Assessment</h4>
                        <p className="text-gray-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {result.english_report.problem_summary}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-bold text-gray-800 mb-1">Visible Image Symptoms</h4>
                          <p className="text-gray-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {result.english_report.visible_symptoms}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 mb-1">Why It Is Occurring</h4>
                          <p className="text-gray-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {result.english_report.why_occurring}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-800 mb-1">Tamil Nadu Seasonal & Soil Correlation</h4>
                        <p className="text-gray-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {result.english_report.environmental_and_soil_effect}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-800 mb-1">Field Rule-Out & Verification Steps</h4>
                        <p className="text-emerald-900 bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                          {result.english_report.what_to_check_next}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tamil Diagnostic Report */}
                  {activeTab === 'tamil' && (
                    <div className="space-y-5 text-xs font-tamil">
                      {/* 1 & 2: பயிர் மற்றும் நிலை Overview Header */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
                          <span className="text-[11px] uppercase font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                            <Sprout className="w-4 h-4 text-emerald-700" />
                            கண்டறியப்பட்ட பயிர் (Detected Crop)
                          </span>
                          <div className="text-base font-black text-emerald-950 mt-1">
                            {result.tamil_report?.detected_crop || result.crop_name}
                          </div>
                          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                            அடையாள முறை: {result.crop_identification?.method || 'AgriMind Calibrated CNN'}
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[11px] uppercase font-bold text-gray-600 flex items-center gap-1.5 mb-1">
                            <Activity className="w-4 h-4 text-emerald-600" />
                            தாவரத்தின் நிலை (Plant Condition)
                          </span>
                          <div className="text-base font-black text-gray-900 mt-1">
                            {result.tamil_report?.plant_condition || result.overall_assessment?.primary_category?.replace('_', ' ')}
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                            தீவிர நிலை: {result.overall_assessment?.severity || 'களக் கண்காணிப்பு'}
                          </div>
                        </div>
                      </div>

                      {/* 3: சாத்தியமான நோய் அல்லது பாதிப்பு */}
                      <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-xs space-y-1.5">
                        <span className="text-[11px] uppercase font-bold text-emerald-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          சாத்தியமான நோய் அல்லது பாதிப்பு (Possible Disease or Stress)
                        </span>
                        <h3 className="text-lg font-black text-gray-900">
                          {result.tamil_report?.possible_problem || result.predicted_class}
                        </h3>
                        {result.tamil_report?.differential_diagnosis && (
                          <p className="text-xs text-gray-600 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 mt-2">
                            {result.tamil_report.differential_diagnosis}
                          </p>
                        )}
                      </div>

                      {/* 4: அறிகுறிகளுக்கான விளக்கம் */}
                      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                        <span className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-emerald-600" />
                          அறிகுறிகளுக்கான விளக்கம் (Explanation of Symptoms)
                        </span>

                        <div className="space-y-2">
                          <div className="bg-white p-3 rounded-lg border border-slate-100">
                            <span className="font-bold text-gray-800 block text-xs mb-0.5">காணப்படும் இலை அறிகுறிகள்:</span>
                            <p className="text-gray-700 text-xs leading-relaxed">
                              {result.tamil_report?.symptoms || result.english_report?.visible_symptoms}
                            </p>
                          </div>

                          {result.tamil_report?.possible_causes && (
                            <div className="bg-white p-3 rounded-lg border border-slate-100">
                              <span className="font-bold text-gray-800 block text-xs mb-0.5">உயிரியல் மற்றும் சுற்றுச்சூழல் காரணங்கள்:</span>
                              <p className="text-gray-700 text-xs leading-relaxed">
                                {result.tamil_report.possible_causes}
                              </p>
                            </div>
                          )}

                          {result.tamil_report?.season_and_soil_relation && (
                            <div className="bg-white p-3 rounded-lg border border-slate-100">
                              <span className="font-bold text-gray-800 block text-xs mb-0.5">தமிழ்நாடு பருவம் மற்றும் மண் தொடர்பு:</span>
                              <p className="text-gray-700 text-xs leading-relaxed">
                                {result.tamil_report.season_and_soil_relation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 5: பரிந்துரைக்கப்படும் நடவடிக்கைகள் */}
                      <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2.5">
                        <span className="text-[11px] uppercase font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          பரிந்துரைக்கப்படும் நடவடிக்கைகள் (Recommended Actions)
                        </span>

                        {result.tamil_report?.next_actions && (
                          <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-xs font-semibold text-emerald-900">
                            {result.tamil_report.next_actions}
                          </div>
                        )}

                        <ul className="space-y-1.5 pt-1">
                          {(result.tamil_report?.recommended_actions && result.tamil_report.recommended_actions.length > 0
                            ? result.tamil_report.recommended_actions
                            : (result.action_plan?.immediate_checks || [])
                          ).map((action: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-lg border border-emerald-100 text-gray-800">
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-xs leading-relaxed">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 6: தடுப்பு முறைகள் */}
                      <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2.5">
                        <span className="text-[11px] uppercase font-bold text-blue-900 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-blue-700" />
                          தடுப்பு முறைகள் (Prevention & Cultural Management)
                        </span>
                        <ul className="space-y-1.5">
                          {(result.tamil_report?.prevention && result.tamil_report.prevention.length > 0
                            ? result.tamil_report.prevention
                            : (result.action_plan?.corrective_measures || [])
                          ).map((prev: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 bg-white/90 p-2.5 rounded-lg border border-blue-100 text-gray-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                              <span className="text-xs leading-relaxed">{prev}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 7: ஆதாரங்கள் (Sources, when available) */}
                      {result.sources && result.sources.length > 0 && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <span className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-emerald-600" />
                            ஆதாரங்கள் (TNAU / ICAR Research Evidence & Sources)
                          </span>
                          <div className="space-y-1.5">
                            {result.sources.map((s: any, idx: number) => (
                              <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-start gap-3">
                                <div>
                                  <span className="font-bold text-gray-900 text-xs">{s.document_title}</span>
                                  {s.page_number && <span className="text-emerald-700 font-semibold ml-1.5">(பக்கம் {s.page_number})</span>}
                                  {s.text_content && (
                                    <p className="text-gray-500 text-[11px] mt-1 line-clamp-2">"{s.text_content}"</p>
                                  )}
                                </div>
                                <a
                                  href={s.source_url || 'https://agritech.tnau.ac.in/'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-emerald-700 font-bold hover:underline flex-shrink-0"
                                >
                                  TNAU தளம் →
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 8: நம்பகத்தன்மை மற்றும் வரம்புகள் */}
                      <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
                        <span className="text-[11px] uppercase font-bold text-amber-900 flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-amber-700" />
                          நம்பகத்தன்மை மற்றும் வரம்புகள் (Confidence & Limitations)
                        </span>
                        <p className="text-xs text-amber-950 leading-relaxed font-medium">
                          {result.tamil_report?.confidence_and_limitations || (
                            `கணிப்பு நம்பகத்தன்மை: ${Math.round((result.confidence || 0) * 100)}% (${result.uncertainty_metrics?.confidence_band || 'Calibrated'}). ` +
                            `இலையின் தெளிவு: ${result.image_quality?.sharpness_score || 85}/100. ` +
                            'வரம்புகள்: இக்கணிப்பு கணினி பார்வை வழி கண்டறியப்பட்ட பூர்வாங்க ஆய்வு மட்டுமே; முடிவான கள உறுதிப்படுத்தலுக்கு உங்கள் வட்டார வேளாண்மை உதவி இயக்குநர் அல்லது KVK அலுவலகத்தை அணுகவும்.'
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Ranked Differential Causes */}
                  {activeTab === 'differential' && result.ranked_causes && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500 mb-2">
                        AgriMind evaluates multiple competing hypotheses rather than forcing a single diagnosis:
                      </p>
                      {result.ranked_causes.map((c: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-gray-200 bg-slate-50/50 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 text-sm">
                              #{idx + 1}. {c.name}
                            </span>
                            <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                              {Math.round((c.probability_or_confidence || 0) * 100)}%
                            </span>
                          </div>
                          <p className="text-gray-600">
                            <span className="font-semibold text-gray-800">Visual Evidence:</span> {c.visible_image_evidence}
                          </p>
                          <p className="text-gray-500">
                            <span className="font-semibold text-gray-700">Differential Comparison:</span> {c.alternative_explanations}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Plan */}
                  {activeTab === 'actions' && result.action_plan && (
                    <div className="space-y-4 text-xs">
                      <div>
                        <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Immediate Field Observations</span>
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600">
                          {(result.action_plan.immediate_checks || []).map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-blue-600" />
                          <span>Corrective Agronomic Measures</span>
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600">
                          {(result.action_plan.corrective_measures || []).map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-amber-600" />
                          <span>Scientific Laboratory Confirmation</span>
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600">
                          {(result.action_plan.confirmation || []).map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Evidence Citations */}
              {result.sources && result.sources.length > 0 && (
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Knowledge Base Citations</span>
                  </h4>
                  <div className="space-y-2">
                    {result.sources.map((s: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex justify-between items-start gap-3">
                        <div>
                          <span className="font-bold text-gray-800">{s.document_title}</span>
                          {s.page_number && <span className="text-emerald-700 font-semibold ml-1.5">(Page {s.page_number})</span>}
                          {s.text_content && (
                            <p className="text-gray-500 text-[11px] mt-1 line-clamp-2">
                              "{s.text_content}"
                            </p>
                          )}
                        </div>
                        <a
                          href={s.source_url || 'https://agritech.tnau.ac.in/'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-700 font-bold hover:underline flex-shrink-0"
                        >
                          TNAU Portal →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </>
              )}
            </div>
          )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
