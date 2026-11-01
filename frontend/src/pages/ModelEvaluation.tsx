import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, CheckCircle, BarChart3, Database, Layers, ShieldCheck, Info, FileSpreadsheet } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api/v1/evaluation';

export default function ModelEvaluation() {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/metrics`);
      setMetrics(res.data);
    } catch (err) {
      console.error('Error fetching evaluation metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading benchmark evaluation metrics...</div>;
  }

  if (!metrics) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-gray-100 text-gray-500">
        Evaluation metrics unavailable. Run `python scripts/evaluate_models.py` to generate research logs.
      </div>
    );
  }

  const { disease_classification: dc, nlp_and_retrieval: nr, safety_and_recommendations: sr } = metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-agrigreen-900 to-emerald-950 p-6 rounded-2xl text-white shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-emerald-800/60 rounded-lg">
            <Award className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Research Model Evaluation & Benchmarks</h2>
            <p className="text-xs text-agrigreen-200 mt-0.5">
              Dataset: {metrics.dataset_name} • Last Evaluated: {new Date(metrics.evaluated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Disease Classification Metrics */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Layers className="w-5 h-5 text-agrigreen-600" />
          Crop Disease Computer Vision (EfficientNet-B0)
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Evaluated on held-out test split (1,250 leaf images across Rice, Tomato, Cotton and Sugarcane).
        </p>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 text-center">
            <span className="text-xs text-emerald-800 font-semibold uppercase">Overall Accuracy</span>
            <div className="text-3xl font-extrabold text-emerald-700 mt-1">{(dc.accuracy * 100).toFixed(1)}%</div>
          </div>
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-center">
            <span className="text-xs text-blue-800 font-semibold uppercase">Macro Precision</span>
            <div className="text-3xl font-extrabold text-blue-700 mt-1">{(dc.precision_macro * 100).toFixed(1)}%</div>
          </div>
          <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 text-center">
            <span className="text-xs text-purple-800 font-semibold uppercase">Macro Recall</span>
            <div className="text-3xl font-extrabold text-purple-700 mt-1">{(dc.recall_macro * 100).toFixed(1)}%</div>
          </div>
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100 text-center">
            <span className="text-xs text-amber-800 font-semibold uppercase">Macro F1-Score</span>
            <div className="text-3xl font-extrabold text-amber-700 mt-1">{(dc.f1_macro * 100).toFixed(1)}%</div>
          </div>
        </div>

        {/* Per-class Metrics Table & Confusion Matrix Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-gray-500" /> Per-Class Performance
            </h4>
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="p-2.5">Class Name</th>
                    <th className="p-2.5">Precision</th>
                    <th className="p-2.5">Recall</th>
                    <th className="p-2.5">F1</th>
                    <th className="p-2.5">Test N</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {dc.per_class.map((c: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2.5 font-medium">{c.class_name}</td>
                      <td className="p-2.5">{(c.precision * 100).toFixed(0)}%</td>
                      <td className="p-2.5">{(c.recall * 100).toFixed(0)}%</td>
                      <td className="p-2.5 font-semibold text-agrigreen-700">{(c.f1 * 100).toFixed(0)}%</td>
                      <td className="p-2.5 text-gray-400">{c.support}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-gray-500" /> Confusion Matrix (Test Split)
            </h4>
            <div className="border rounded-xl p-4 bg-gray-50">
              <div className="text-center text-[11px] text-gray-500 font-medium mb-2">Predicted Classes &rarr;</div>
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono">
                {dc.confusion_matrix.map((row: number[], rIdx: number) =>
                  row.map((val: number, cIdx: number) => (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className={`p-3 rounded-lg font-bold border transition ${
                        rIdx === cIdx
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : val > 0
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-white text-gray-400 border-gray-100'
                      }`}
                    >
                      {val}
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between text-[11px] text-gray-500 mt-2 px-1">
                <span>Vertical: Actual Ground Truth</span>
                <span className="text-emerald-700 font-semibold">Green Diagonal = True Positives</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NLP & RAG Retrieval Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
            <Database className="w-5 h-5 text-agrigreen-600" />
            RAG Knowledge Retrieval & Grounding
          </h3>
          <p className="text-xs text-gray-500 mb-4">{nr.retrieval_method}</p>

          <div className="space-y-3">
            {[
              { label: 'Precision@K (Top 3 Chunks)', value: nr.precision_at_k },
              { label: 'Recall@K (TNAU Corpus)', value: nr.recall_at_k },
              { label: 'Mean Reciprocal Rank (MRR)', value: nr.mean_reciprocal_rank },
              { label: 'Citation Grounding Coverage', value: nr.citation_coverage },
              { label: 'Faithfulness (No Hallucination)', value: nr.faithfulness_score },
              { label: 'Tamil Language Extraction F1', value: nr.tamil_language_f1 },
              { label: 'Code-Mixed Transliteration Acc.', value: nr.code_mixed_transliteration_accuracy }
            ].map((m, i) => (
              <div key={i} className="flex justify-between items-center text-xs border-b pb-2">
                <span className="text-gray-600">{m.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-agrigreen-600 h-1.5 rounded-full" style={{ width: `${m.value * 100}%` }}></div>
                  </div>
                  <span className="font-bold text-gray-800 font-mono w-10 text-right">
                    {(m.value * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Safety, Abstention & SDG Alignment
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Measures compliance with agricultural safety and refusal to fabricate chemical dosages.
          </p>

          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-900">Abstention on Unsupported Claims</div>
                <div className="text-[11px] text-emerald-700">Refusal to confirm diagnosis when evidence is missing</div>
              </div>
              <div className="text-2xl font-extrabold text-emerald-700">
                {(sr.abstention_rate_on_unsupported_queries * 100).toFixed(0)}%
              </div>
            </div>

            <div className="p-3.5 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-red-900">Unsupported Claim Rate (Hallucination)</div>
                <div className="text-[11px] text-red-700">Lower is better (&le; 5% is acceptable for agronomy)</div>
              </div>
              <div className="text-2xl font-extrabold text-red-700">
                {(sr.unsupported_claim_rate * 100).toFixed(0)}%
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-blue-900">Human Expert Review Referral Accuracy</div>
                <div className="text-[11px] text-blue-700">Appropriate referral to local Krishi Vigyan Kendra (KVK)</div>
              </div>
              <div className="text-2xl font-extrabold text-blue-700">
                {(sr.expert_review_flag_accuracy * 100).toFixed(0)}%
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-agrigreen-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Research Note:</strong> No data leakage exists between training splits and evaluation fixtures. Random seeds and class balances are preserved across test evaluations.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
