import { useState, useEffect, useMemo } from "react";
import RFPCard from "../components/RFPCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { mockData } from "../utils/mockData";

export default function Dashboard({ backendOnline, api, onSelectMatch }) {
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, [backendOnline]);

  async function loadData() {
    setLoading(true);
    try {
      if (backendOnline) {
        const [matchRes, statsRes] = await Promise.all([
          api.matches.list(mockData.user.id, { limit: 200 }),
          api.rfps.stats(),
        ]);
        setMatches(matchRes.items || []);
        setStats(statsRes);
      } else {
        setMatches(mockData.matches);
        setStats({ total: mockData.rfps.length, open: mockData.rfps.length, agencies: 20 });
      }
    } catch {
      setMatches(mockData.matches);
      setStats({ total: mockData.rfps.length, open: mockData.rfps.length, agencies: 20 });
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let result = matches;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) => {
        const rfp = m.rfp || {};
        return (
          (rfp.title || "").toLowerCase().includes(q) ||
          (rfp.agency || "").toLowerCase().includes(q) ||
          (rfp.naics_code || "").toLowerCase().includes(q) ||
          (m.match_reasons || []).some((r) => r.toLowerCase().includes(q))
        );
      });
    }

    if (filter === "high") {
      result = result.filter((m) => m.relevance_score >= 65);
    } else if (filter !== "all") {
      result = result.filter((m) => m.status === filter);
    }

    return result;
  }, [matches, search, filter]);

  const avgScore = matches.length > 0
    ? Math.round(matches.reduce((s, m) => s + m.relevance_score, 0) / matches.length)
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-3 lg:p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
          <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
        </div>
        <div className="card p-3 lg:p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Open</p>
          <p className="text-xl lg:text-2xl font-bold text-green-600 mt-1">{stats?.open || 0}</p>
        </div>
        <div className="card p-3 lg:p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Avg Score</p>
          <p className="text-xl lg:text-2xl font-bold text-gov-600 mt-1">{avgScore}%</p>
        </div>
        <div className="card p-3 lg:p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Agencies</p>
          <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">{stats?.agencies || 0}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input-field pl-9"
            placeholder="Search by title, agency, NAICS code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["all", "high", "pending", "reviewed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? "bg-gov-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "high" ? "High Match" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        Showing {filtered.length} of {matches.length} matches
      </p>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">
            {search ? "No matches match your search." : "No matches found for this filter."}
          </p>
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
