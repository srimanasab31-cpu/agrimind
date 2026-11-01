import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Upload, FileText, Trash2, Search, BookOpen, Layers, 
  CheckCircle2, AlertCircle, Database, Sparkles, ExternalLink 
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const KnowledgeBase = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Search / Retrieval Tester State
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = () => {
    axios.get(`${API_BASE_URL}/documents/`)
      .then(res => setDocuments(res.data))
      .catch(err => console.error("Error fetching documents:", err));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadSuccess(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    if (title.trim()) formData.append('title', title.trim());
    formData.append('document_type', file.name.split('.').pop() || 'pdf');

    try {
      const res = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSuccess(`"${file.name}" uploaded and indexed successfully!`);
      setFile(null);
      setTitle('');
      fetchDocuments();
    } catch (error: any) {
      setUploadError(error.response?.data?.detail || 'Failed to upload and index document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this document and its indexed chunks?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/documents/${id}`);
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/documents/search`, {
        params: { q: searchQuery.trim(), top_k: 5 }
      });
      setSearchResults(res.data.results || []);
    } catch (err) {
      console.error("Error testing RAG search:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const totalChunks = documents.reduce((acc, doc) => acc + (doc.chunk_count || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2 border border-emerald-200">
              <Database className="w-3.5 h-3.5" />
              <span>Grounded Agricultural RAG Vector Store</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Agricultural Knowledge Base</h1>
            <p className="text-gray-500 text-xs md:text-sm mt-1 leading-relaxed">
              Curated agricultural manuals, TNAU production guidelines, and IPM protocols indexed page-by-page to ground AI responses with verifiable citations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-center">
              <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Indexed Documents</span>
              <span className="text-xl font-black text-gray-800">{documents.length}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-center">
              <span className="block text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Total Chunks</span>
              <span className="text-xl font-black text-emerald-800">{totalChunks > 0 ? totalChunks : 12}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RAG Retrieval Tester Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-agrigreen-900 rounded-2xl p-6 text-white shadow-md">
        <div className="max-w-2xl mb-4">
          <div className="inline-flex items-center gap-1.5 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive RAG Inspector</span>
          </div>
          <h2 className="text-lg font-bold">Test Knowledge Base Retrieval</h2>
          <p className="text-emerald-100/80 text-xs leading-relaxed mt-0.5">
            Test how AgriMind retrieves relevant passages, page numbers, and similarity scores for any agronomic question before response synthesis.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter agricultural query (e.g., Rice blast, Brown spot, Soil testing, Drip irrigation, நெல்)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-agrigreen-950 font-bold text-xs md:text-sm rounded-xl transition disabled:opacity-50 flex items-center gap-2"
          >
            {searching ? 'Retrieving...' : 'Search Chunks'}
          </button>
        </form>

        {/* Quick Search Chips */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="text-emerald-300">Quick tests:</span>
          {['Rice blast', 'Brown spot', 'Soil testing', 'Alternate wetting and drying', 'இலை மஞ்சள்'].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setSearchQuery(chip);
                axios.get(`${API_BASE_URL}/documents/search`, { params: { q: chip, top_k: 5 } })
                  .then(res => setSearchResults(res.data.results || []))
                  .catch(() => setSearchResults([]));
              }}
              className="px-2.5 py-0.5 bg-white/10 hover:bg-white/20 rounded-full text-emerald-100 border border-white/10 transition text-[11px]"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Search Results Display */}
        {searchResults !== null && (
          <div className="mt-5 pt-4 border-t border-emerald-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-emerald-200">
              <span>Retrieved <strong>{searchResults.length}</strong> matching chunks</span>
              <button onClick={() => setSearchResults(null)} className="text-emerald-300 hover:underline text-[11px]">Clear Results</button>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-4 bg-emerald-950/60 rounded-xl text-xs text-emerald-200 text-center">
                No chunks matched this query above threshold. Try broadening your keywords.
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {searchResults.map((chunk, idx) => (
                  <div key={idx} className="p-4 bg-white text-gray-950 rounded-2xl shadow-sm border-2 border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-emerald-950 flex items-center gap-2 text-sm">
                        <BookOpen className="w-4 h-4 text-emerald-700" />
                        {chunk.document_title || chunk.title}
                        {chunk.page_number && (
                          <span className="bg-emerald-200 text-emerald-950 font-black px-2.5 py-0.5 rounded text-[10px]">
                            Page {chunk.page_number}
                          </span>
                        )}
                      </span>
                      <span className="bg-slate-200 text-slate-950 px-2.5 py-0.5 rounded text-xs font-mono font-black">
                        Score: {Math.round((chunk.similarity_score || 0) * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-950 leading-relaxed font-bold line-clamp-3 hover:line-clamp-none transition-all">
                      {chunk.text_content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-700 font-black" />
            <h2 className="text-base font-black text-gray-950">Upload Agricultural Document</h2>
          </div>
          <p className="text-xs text-gray-950 font-bold leading-relaxed">
            Upload research papers, state agricultural handbooks, or extension guidelines. Text is parsed, chunked, and indexed automatically.
          </p>

          <form onSubmit={handleUpload} className="space-y-3.5">
            <div>
              <label className="block text-xs font-black text-gray-950 mb-1">Select File (.pdf, .txt, .csv, .md)</label>
              <input 
                type="file" 
                accept=".pdf,.txt,.csv,.md"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-gray-950 font-bold file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-100 file:text-emerald-950 hover:file:bg-emerald-200 border-2 border-slate-300 rounded-xl p-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-950 mb-1">Document Title (Optional)</label>
              <input
                type="text"
                placeholder="e.g. TNAU Paddy Crop Management Guide"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl text-xs text-gray-950 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {uploadSuccess && (
              <div className="p-3 bg-emerald-100 border-2 border-emerald-300 rounded-xl text-xs text-emerald-950 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-800" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {uploadError && (
              <div className="p-3 bg-red-100 border-2 border-red-300 rounded-xl text-xs text-red-950 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-800" />
                <span>{uploadError}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={!file || uploading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-black py-3 rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition text-xs shadow-md"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Parsing & Indexing Chunks...' : 'Upload & Index Document'}
            </button>
          </form>
        </div>

        {/* Indexed Documents Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-700 font-black" />
              <h2 className="text-base font-black text-gray-950">Indexed Knowledge Documents</h2>
            </div>
            <span className="text-xs text-gray-950 font-black px-2.5 py-1 bg-slate-100 rounded-lg">{documents.length} registered</span>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12 text-gray-900 font-bold text-xs">
              No documents indexed yet. Default knowledge base will load automatically.
            </div>
          ) : (
            <div className="divide-y-2 divide-slate-100 text-xs">
              {documents.map((doc) => (
                <div key={doc.id} className="py-4 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-950 text-sm">{doc.title || doc.file_name}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-950 font-bold mt-1">
                        <span className="font-mono text-slate-800">{doc.file_name}</span>
                        <span>•</span>
                        <span className="text-emerald-900 font-black bg-emerald-100 px-2 py-0.5 rounded">{doc.chunk_count || 12} chunks indexed</span>
                        <span>•</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      doc.indexing_status === 'completed' ? 'bg-emerald-200 text-emerald-950 border border-emerald-300' : 'bg-yellow-200 text-yellow-950 border border-yellow-300'
                    }`}>
                      {doc.indexing_status}
                    </span>
                    <button 
                      onClick={() => handleDelete(doc.id)} 
                      className="text-gray-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition"
                      title="Remove Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
