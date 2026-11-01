import React from 'react';
import { 
  Sparkles, ShieldCheck, Search, Bot, Cpu, 
  Layers, CheckCircle2, AlertTriangle, ArrowRight, 
  Camera, FileText, Activity, Thermometer, Eye
} from 'lucide-react';

export default function HowItWorks() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Architecture & Working Principles</span>
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            <span>AgriMind 2.0</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">How AgriMind Works</h1>
          <p className="text-gray-600 text-xs md:text-sm mt-1 max-w-2xl">
            A transparent overview of our multimodal agricultural AI pipeline, domain-gated assistant, and uncertainty-calibrated crop health analysis.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
            Tamil Nadu & Indian Agronomy
          </span>
        </div>
      </div>

      {/* SECTION 1: How the Website Works */}
      <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">How the Website Works</h2>
            <p className="text-xs text-gray-500">Four straightforward steps from farmer inquiry to actionable advice</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-sm text-gray-900">Ask or Upload</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                The farmer asks an agricultural question in Tamil or English, or uploads a close-up photo of an affected crop leaf.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-sm text-gray-900">Process & Retrieve</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                AgriMind validates inputs, checks domain relevance, and retrieves evidence from verified TNAU & ICAR publications.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-sm text-gray-900">Contextual Diagnosis</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                The neural classifier assesses plant health with calibrated confidence, while the LLM generates a grounded explanation.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                4
              </span>
              <h3 className="font-bold text-sm text-gray-900">Clear Next Steps</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                The user receives findings, transparent confidence bands, citations, and practical field inspection steps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: How the AI Agricultural Assistant Works */}
      <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">How the AI Agricultural Assistant Works</h2>
            <p className="text-xs text-gray-500">Evidence-grounded conversational pipeline with strict domain protection</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Card 1 */}
          <div className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">Domain Validation</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Validates that queries relate strictly to agriculture, crops, pests, soil, or AgriMind. Non-agricultural prompts are politely redirected.
            </p>
          </div>

          {/* Card 2 */}
          <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">RAG Knowledge Retrieval</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Scans indexed TNAU and ICAR crop production guides. Extracts top relevant passages to ground every advisory in research facts.
            </p>
          </div>

          {/* Card 3 */}
          <div className="border border-purple-100 bg-purple-50/40 rounded-xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">Gemini LLM Synthesis</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Synthesizes fluent, context-aware answers in Tamil (தமிழ்), English, or mixed dialect tailored to local cropping calendars.
            </p>
          </div>

          {/* Card 4 */}
          <div className="border border-amber-100 bg-amber-50/40 rounded-xl p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">Evidence & Safety Checks</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Validates citations against actual retrieved documents. Avoids fabricating chemical dosages and advises KVK confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: How Crop Images Are Analysed */}
      <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">How Crop Images Are Analysed</h2>
            <p className="text-xs text-gray-500">Hierarchical computer vision, calibrated uncertainty, and explainable AI</p>
          </div>
        </div>

        {/* Visual Workflow Diagram */}
        <div className="bg-slate-900 text-white rounded-xl p-4 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] text-xs font-medium gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Image Upload</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>2. Quality Check</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>3. Crop ID</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
              <Cpu className="w-3.5 h-3.5 text-yellow-400" />
              <span>4. Condition Classification</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
              <Thermometer className="w-3.5 h-3.5 text-red-400" />
              <span>5. Uncertainty</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-500 text-emerald-200">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>6. Report</span>
            </div>
          </div>
        </div>

        {/* Implemented Techniques Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          <div className="border border-gray-200 rounded-xl p-3.5 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>MobileNetV3-Small Dual-Head</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Extracts high-resolution foliar features to identify crops and candidate conditions without heavy cloud latency.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-3.5 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Hierarchical Diagnosis</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Categorizes broad stress types (fungal, bacterial, viral, nutrient deficiency, water) before narrowing to crop-restricted diseases.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-3.5 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <Thermometer className="w-3.5 h-3.5 text-purple-600" />
              <span>Temperature Scaling</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Post-hoc calibration scales raw logits (T=1.35 crop, T=1.42 condition) to prevent overconfident diagnostic errors.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-3.5 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span>Entropy & OOD Abstention</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Computes normalized Shannon entropy; automatically flags non-plant images and triggers honest abstention when ambiguous.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-3.5 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <Eye className="w-3.5 h-3.5 text-rose-600" />
              <span>Grad-CAM Visual Attention</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Generates color heatmaps showing leaf regions driving the classification, giving visual evidence for user verification.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-3.5 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Gemini Multimodal AI</span>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              When configured, provides complementary visual symptom verification and bilingual field guidance grounded in TNAU recommendations.
            </p>
          </div>
        </div>

        {/* Responsible AI Disclaimer Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-900 space-y-0.5">
            <span className="font-bold">Responsible AI Field Notice: </span>
            <span className="text-amber-800">
              Image-based automated analyses are advisory and preliminary. Environmental factors, lighting, and multiple concurrent stresses can affect accuracy. Always corroborate unexpected results with a qualified Agricultural Extension Officer (KVK) or local university plant clinic before making major input investments.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
