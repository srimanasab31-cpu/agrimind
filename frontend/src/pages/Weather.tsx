import React, { useState, useEffect } from 'react';
import { CloudSun, Search, Droplets, Wind, Thermometer, CloudRain, AlertCircle, Info, MapPin } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1/weather';

export default function Weather() {
  const [location, setLocation] = useState('Coimbatore');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeather('Coimbatore');
  }, []);

  const fetchWeather = async (locToFetch: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}?location=${encodeURIComponent(locToFetch)}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch weather data from backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      fetchWeather(location);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CloudSun className="w-6 h-6 text-agrigreen-600" />
            Weather Intelligence & Agro-Climatology
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            Real-time atmospheric readings and crop protection advisories for Tamil Nadu agricultural tracts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="e.g. Thanjavur, Madurai..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-agrigreen-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-agrigreen-700 text-white rounded-lg text-sm font-semibold hover:bg-agrigreen-800 transition disabled:opacity-50"
          >
            {loading ? 'Fetching...' : 'Check'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Weather Metric Cards */}
      {data && (
        <div className="space-y-6">
          {/* Provider status badge */}
          <div className="flex items-center justify-between text-xs px-2 text-gray-500">
            <span>Provider: <strong>{data.provider}</strong></span>
            <span>Recorded: {new Date(data.timestamp).toLocaleTimeString()}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <Thermometer className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Temperature</span>
                <div className="text-2xl font-bold text-gray-800">{data.temperature}&deg;C</div>
                <span className="text-xs text-gray-500">{data.description}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Droplets className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Relative Humidity</span>
                <div className="text-2xl font-bold text-gray-800">{data.humidity}%</div>
                <span className="text-xs text-gray-500">
                  {data.humidity > 80 ? 'High Fungus Risk' : 'Normal Range'}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-cyan-50 rounded-xl">
                <CloudRain className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Precipitation</span>
                <div className="text-2xl font-bold text-gray-800">{data.rainfall} mm</div>
                <span className="text-xs text-gray-500">
                  {data.rainfall > 0 ? 'Rainfall Active' : 'No Rain in Past Hour'}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-teal-50 rounded-xl">
                <Wind className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Wind Speed</span>
                <div className="text-2xl font-bold text-gray-800">{data.wind_speed} km/h</div>
                <span className="text-xs text-gray-500">
                  {data.wind_speed > 15 ? 'Avoid Foliar Spraying' : 'Favorable for Spraying'}
                </span>
              </div>
            </div>
          </div>

          {/* Contextual Weather Advisory Box */}
          <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200 shadow-sm">
            <h4 className="font-bold text-emerald-900 text-sm mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-700" /> Weather-Grounded Farming Advisory
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-emerald-800">
              <div className="bg-white/80 p-3 rounded-lg border border-emerald-100">
                <strong>Irrigation Guidance:</strong>{' '}
                {data.rainfall > 1.0 
                  ? 'Rainfall detected. Postpone scheduled field irrigation to prevent root hypoxia.' 
                  : 'Favorable soil drying rate. Proceed with normal scheduled drip or surface irrigation.'}
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-emerald-100">
                <strong>Spray Application Timing:</strong>{' '}
                {data.wind_speed > 14
                  ? 'High wind gusts may cause chemical drift. Postpone foliar micronutrient spraying.'
                  : 'Wind speeds are calm (&lt; 14 km/h). Safe for bio-pesticide or neem oil spraying.'}
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-emerald-100">
                <strong>Disease Spore Risk:</strong>{' '}
                {data.humidity > 75
                  ? 'High humidity creates conducive environment for blast and blight fungi. Inspect crop collar.'
                  : 'Relative humidity is moderate. Low immediate risk of fungal spore germination.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
