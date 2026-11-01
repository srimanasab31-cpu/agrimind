import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History, MessageSquare, Trash2, Calendar, Globe, Eye, RefreshCw, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export default function QueryHistory() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState('all');
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/conversations`);
      setConversations(res.data);
    } catch (err) {
      console.error('Error fetching conversation history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConversation = async (sessionId: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/chat/conversations/${sessionId}`);
      setActiveSession(res.data);
    } catch (err) {
      alert('Failed to load conversation details.');
    }
  };

  const handleDeleteConversation = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation record?')) return;
    try {
      setDeleting(true);
      await axios.delete(`${API_BASE_URL}/conversations/${sessionId}`);
      if (activeSession?.session_id === sessionId) {
        setActiveSession(null);
      }
      fetchHistory();
    } catch (err) {
      alert('Failed to delete conversation.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = conversations.filter(c => {
    const matchesSearch = c.preview?.toLowerCase().includes(searchQuery.toLowerCase()) || c.session_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = selectedLang === 'all' || c.language === selectedLang;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <History className="w-6 h-6 text-agrigreen-600" />
            Agricultural Query History
          </h2>
          <p className="text-gray-500 text-sm">
            Inspect past farmer inquiries, language detection logs, and retrieved grounding citations.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between">
        <input
          type="text"
          placeholder="Search previous queries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm w-full md:max-w-md focus:outline-none focus:ring-2 focus:ring-agrigreen-600"
        />
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500">Filter Language:</span>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="border text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-agrigreen-600 text-gray-700"
          >
            <option value="all">All Languages</option>
            <option value="en">English (en)</option>
            <option value="ta">Tamil (ta)</option>
          </select>
        </div>
      </div>

      {/* History List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="bg-white p-12 text-center rounded-xl text-gray-500">Loading query history...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-100 text-gray-500">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p>No agricultural queries found in records.</p>
              <p className="text-xs text-gray-400 mt-1">Submit questions in the AI Assistant to see them appear here.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenConversation(item.session_id)}
                className={`p-4 bg-white rounded-xl border transition cursor-pointer flex justify-between items-center ${
                  activeSession?.session_id === item.session_id
                    ? 'border-agrigreen-600 ring-2 ring-agrigreen-100 shadow-sm'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                      item.language === 'ta' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.language === 'ta' ? 'Tamil' : 'English'}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.updated_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-400">
                      • {item.message_count} messages
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">{item.preview}</h4>
                  <p className="text-xs text-gray-400 mt-1 font-mono truncate">Session: {item.session_id}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDeleteConversation(item.session_id, e)}
                    disabled={deleting}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Eye className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Conversation Preview Panel */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-fit sticky top-6">
          <h3 className="font-bold text-gray-800 mb-3 border-b pb-2 flex items-center justify-between">
            <span>Conversation Inspection</span>
            {activeSession && (
              <span className="text-xs font-normal text-gray-400 font-mono">
                {activeSession.session_id.substring(0, 8)}...
              </span>
            )}
          </h3>

          {!activeSession ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              <Eye className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              Click any query from the list to inspect full conversation messages and sources.
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {activeSession.messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-100 ml-4'
                      : 'bg-gray-50 text-gray-800 border border-gray-100 mr-4'
                  }`}
                >
                  <div className="font-semibold capitalize mb-1 text-[11px] text-gray-500">
                    {msg.role === 'user' ? 'Farmer Question' : 'AgriMind AI Assistant'}
                  </div>
                  <p className="whitespace-pre-line">{msg.response_text}</p>
                  
                  {msg.retrieved_sources && msg.retrieved_sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className="font-semibold text-gray-600">Citations:</span>
                      <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-gray-500">
                        {msg.retrieved_sources.map((s: any, idx: number) => (
                          <li key={idx} className="truncate">
                            {s.document_title} (Sim: {Math.round(s.similarity_score * 100)}%)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
