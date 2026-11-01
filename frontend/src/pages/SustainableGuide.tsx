import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sprout, Search, Filter, BookOpen, AlertCircle, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api/v1/sustainable';

export default function SustainableGuide() {
  const [guides, setGuides] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState<any | null>(null);

  useEffect(() => {
    fetchGuides();
  }, [selectedCategory]);

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'All' 
        ? `${API_BASE_URL}/` 
        : `${API_BASE_URL}/?category=${encodeURIComponent(selectedCategory)}`;
      const res = await axios.get(url);
      setGuides(res.data.guides);
      if (res.data.categories) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error('Error fetching sustainable guides:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGuides = guides.filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.crops.some((c: string) => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-agrigreen-900 via-agrigreen-800 to-emerald-900 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-agrigreen-700/50 rounded-lg">
            <Sprout className="w-6 h-6 text-emerald-300" />
          </div>
          <h2 className="text-2xl font-bold">Sustainable Agriculture Guide</h2>
        </div>
        <p className="text-agrigreen-100 max-w-2xl text-sm">
          Evidence-grounded agronomic practices aligned with UN SDG 2 (Zero Hunger) and SDG 12 (Responsible Production). Curated from ICAR, TNAU, and agro-ecological research publications.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-agrigreen-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search practices or crops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-agrigreen-600"
          />
        </div>
      </div>

      {/* Guide Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading agronomic guides...</div>
      ) : filteredGuides.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border text-gray-500">
          No sustainable practices found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGuides.map((guide) => (
            <div
              key={guide.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedGuide(guide)}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    {guide.category}
                  </span>
                  <div className="flex gap-1">
                    {guide.crops.map((c: string) => (
                      <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{guide.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{guide.description}</p>
              </div>

              <div>
                <div className="border-t pt-3 flex items-center justify-between text-xs text-gray-500">
                  <span className="truncate max-w-[240px] italic">Source: {guide.source_citation}</span>
                  <button className="text-agrigreen-700 font-semibold hover:underline flex items-center gap-1">
                    View Steps <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Guide Modal */}
      {selectedGuide && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedGuide(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {selectedGuide.category}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-2">{selectedGuide.title}</h3>
                <div className="flex gap-2 mt-2">
                  {selectedGuide.crops.map((c: string) => (
                    <span key={c} className="text-xs bg-agrigreen-50 text-agrigreen-800 px-2.5 py-1 rounded-md font-medium">
                      Target Crop: {c}
                    </span>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setSelectedGuide(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-agrigreen-600" /> Agronomic Overview
                </h4>
                <p className="text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">{selectedGuide.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-agrigreen-600" /> Applicability Window
                </h4>
                <p className="text-gray-600">{selectedGuide.applicability}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-agrigreen-600" /> Practical Implementation Steps
                </h4>
                <ol className="space-y-2 list-decimal list-inside text-gray-700 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  {selectedGuide.practical_steps.map((step: string, i: number) => (
                    <li key={i} className="leading-relaxed">{step}</li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-red-800 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600" /> Ecological Limitations & Cautions
                </h4>
                <p className="text-red-700 bg-red-50 p-3 rounded-lg border border-red-100">{selectedGuide.limitations}</p>
              </div>

              <div className="pt-2 border-t text-xs text-gray-500">
                <strong>Source Citation:</strong> {selectedGuide.source_citation}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
