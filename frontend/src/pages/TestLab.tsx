import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FlaskConical, Play, RotateCcw, AlertTriangle, CheckCircle, XCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api/v1/test-lab';

export default function TestLab() {
  const [cases, setCases] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [casesRes, runsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/cases`),
        axios.get(`${API_BASE_URL}/runs`)
      ]);
      setCases(casesRes.data);
      setRuns(runsRes.data);
    } catch (err) {
      console.error('Error fetching test lab data:', err);
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    try {
      setRunning(true);
      await axios.post(`${API_BASE_URL}/run-suite`);
      await fetchData();
    } catch (err) {
      console.error('Error running suite:', err);
    } finally {
      setRunning(false);
    }
  };

  const runSingleTest = async (testId: string) => {
    try {
      setRunning(true);
      await axios.post(`${API_BASE_URL}/run/${testId}`);
      await fetchData();
    } catch (err) {
      console.error(`Error running ${testId}:`, err);
    } finally {
      setRunning(false);
    }
  };

  const resetSession = async () => {
    try {
      if (confirm('Are you sure you want to reset the demo session?')) {
        await axios.post(`${API_BASE_URL}/reset-session`);
        await fetchData();
      }
    } catch (err) {
      console.error('Error resetting session:', err);
    }
  };

  const categories = ['All', ...Array.from(new Set(cases.map(c => c.category)))];
  const filteredCases = cases.filter(c => 
    (selectedCategory === 'All' || c.category === selectedCategory) &&
    (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.test_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getLatestResult = (testId: string) => {
    for (const run of runs) {
      const res = run.results?.find((r: any) => r.test_id === testId);
      if (res) return res;
    }
    return null;
  };

  const stats = {
    total: cases.length,
    executed: runs.length > 0 ? runs[0].results?.length || 0 : 0,
    passed: runs.length > 0 ? runs[0].results?.filter((r:any) => r.status === 'PASS').length || 0 : 0,
    failed: runs.length > 0 ? runs[0].results?.filter((r:any) => r.status === 'FAIL').length || 0 : 0,
    blocked: runs.length > 0 ? runs[0].results?.filter((r:any) => r.status === 'BLOCKED').length || 0 : 0
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">AgriMind Test Lab</h2>
          <p className="text-gray-500">Explore, test and validate the intelligence behind AgriMind.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={resetSession}
            className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700 transition"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Session
          </button>
          <button 
            onClick={runAllTests}
            disabled={running}
            className="flex items-center px-4 py-2 bg-agrigreen-600 text-white rounded-lg hover:bg-agrigreen-700 transition disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2" />
            {running ? 'Executing...' : 'Run All Tests'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Available', value: stats.total, color: 'text-gray-800' },
          { label: 'Executed', value: stats.executed, color: 'text-blue-600' },
          { label: 'Passed', value: stats.passed, color: 'text-green-600' },
          { label: 'Failed', value: stats.failed, color: 'text-red-600' },
          { label: 'Blocked', value: stats.blocked, color: 'text-yellow-600' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  selectedCategory === cat ? 'bg-agrigreen-100 text-agrigreen-800 font-medium' : 'bg-white border text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ml-4 px-3 py-1.5 border rounded-lg text-sm focus:ring-agrigreen-500 focus:border-agrigreen-500"
          />
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading test cases...</div>
          ) : filteredCases.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No test cases found matching filters.</div>
          ) : (
            filteredCases.map(test => {
              const latestResult = getLatestResult(test.test_id);
              const isExpanded = expandedCase === test.test_id;
              
              let statusColor = 'bg-gray-100 text-gray-600';
              let StatusIcon = Info;
              
              if (latestResult) {
                if (latestResult.status === 'PASS') {
                  statusColor = 'bg-green-100 text-green-700';
                  StatusIcon = CheckCircle;
                } else if (latestResult.status === 'FAIL') {
                  statusColor = 'bg-red-100 text-red-700';
                  StatusIcon = XCircle;
                } else if (latestResult.status === 'BLOCKED') {
                  statusColor = 'bg-yellow-100 text-yellow-700';
                  StatusIcon = AlertTriangle;
                }
              }

              return (
                <div key={test.test_id} className="flex flex-col">
                  <div className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedCase(isExpanded ? null : test.test_id)}>
                    <div className="flex items-center space-x-4">
                      <div className={`px-2 py-1 rounded text-xs font-mono font-bold ${statusColor} flex items-center`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {latestResult ? latestResult.status : 'NOT RUN'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{test.test_id}: {test.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-lg">{test.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); runSingleTest(test.test_id); }}
                        disabled={running}
                        className="px-3 py-1 text-sm text-agrigreen-700 bg-agrigreen-50 hover:bg-agrigreen-100 rounded-lg transition disabled:opacity-50"
                      >
                        Run
                      </button>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 text-sm grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <span className="font-semibold text-gray-700">Sample Input:</span>
                          <div className="mt-1 p-2 bg-white border rounded font-mono text-gray-800 break-words">{test.sample_input}</div>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Expected Behavior:</span>
                          <div className="mt-1 p-2 bg-white border rounded text-gray-700">{test.expected_behavior}</div>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Dependency:</span>
                          <div className="mt-1 text-gray-600">{test.required_dependency}</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {latestResult ? (
                          <>
                            <div>
                              <span className="font-semibold text-gray-700">Actual Response:</span>
                              <div className="mt-1 p-2 bg-white border rounded text-gray-700 break-words">
                                {latestResult.actual_response || 'No response recorded.'}
                              </div>
                            </div>
                            {latestResult.error_message && (
                              <div>
                                <span className="font-semibold text-red-700">Error / Reason:</span>
                                <div className="mt-1 p-2 bg-red-50 border border-red-100 text-red-700 rounded break-words">
                                  {latestResult.error_message}
                                </div>
                              </div>
                            )}
                            <div className="text-gray-500 text-xs flex justify-between">
                              <span>Duration: {latestResult.duration_ms}ms</span>
                              <span>Executed: {new Date(latestResult.created_at).toLocaleString()}</span>
                            </div>
                          </>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400 italic">
                            Run this test to view actual results.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
