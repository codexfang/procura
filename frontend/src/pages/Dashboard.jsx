import { useState, useEffect } from "react";
import RFPCard from "../components/RFPCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { mockData } from "../utils/mockData";

export default function Dashboard({ backendOnline, api, onSelectMatch }) {
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, [backendOnline]);

  async function loadData() {
    setLoading(true);
    try {
      if (backendOnline) {
        const [matchRes, statsRes] = await Promise.all([
          api.matches.list(mockData.user.id, { limit: 50 }),
          api.rfps.stats(),
        ]);
        setMatches(matchRes.items || []);
        setStats(statsRes);
      } else {
        setMatches(mockData.matches);
        setStats({ total: mockData.rfps.length, open: mockData.rfps.length, agencies: 4 });
      }
    } catch {
      setMatches(mockData.matches);
      setStats({ total: mockData.rfps.length, open: mockData.rfps.length, agencies: 4 });
    } finally {
      setLoading(false);
    }
  }

  const filtered =
    filter === "all"
      ? matches
      : filter === "high"
      ? matches.filter((m) => m.relevance_score >= 75)
      : matches.filter((m) => m.status === filter);

  const avgScore =
    matches.length > 0
      ? Math.round(
          matches.reduce((s, m) => s + m.relevance_score, 0) / matches.length
        )
      : 0;

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor matched opportunities and track proposal progress
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Matches</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Open</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats?.open || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Avg Relevance</p>
          <p className="text-2xl font-bold text-gov-600 mt-1">{avgScore}%</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Agencies</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.agencies || 0}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {["all", "high", "pending", "reviewed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === f
                ? "bg-gov-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">No matches found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((match) => (
            <RFPCard
              key={match.id}
              match={match}
              onSelect={() => onSelectMatch(match)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
