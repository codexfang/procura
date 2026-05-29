import { useState, useEffect } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { mockData } from "../utils/mockData";

export default function RFPDetail({ backendOnline, api, matchId, onBack, onGenerateDraft }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) {
      setLoading(false);
      setMatch(null);
      return;
    }
    loadMatch();
  }, [matchId, backendOnline]);

  async function loadMatch() {
    setLoading(true);
    try {
      if (backendOnline && matchId && !matchId.startsWith("mock-")) {
        const data = await api.matches.get(matchId);
        setMatch(data);
      } else {
        const found = mockData.matches.find((m) => m.id === matchId);
        setMatch(found || null);
      }
    } catch {
      const found = mockData.matches.find((m) => m.id === matchId);
      setMatch(found || null);
    } finally {
      setLoading(false);
    }
  }

  if (!matchId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2 className="text-lg font-medium text-gray-500 mb-1">No RFP Selected</h2>
        <p className="text-sm text-gray-400">Select a matched opportunity from the Dashboard to view its details.</p>
        <button onClick={onBack} className="btn-primary mt-4">
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Loading RFP details..." />;
  if (!match || !match.rfp) return <div className="card p-8 text-center text-gray-500">RFP not found.</div>;

  const { rfp } = match;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to dashboard
      </button>

      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{rfp.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{rfp.agency}</p>
          </div>
          <div className="text-center shrink-0">
            <div className="text-3xl font-bold text-gray-900">{match.relevance_score}</div>
            <div className="text-xs text-gray-500">Match Score</div>
          </div>
        </div>

        <div className="mt-4 score-bar">
          <div
            className={`score-fill ${
              match.relevance_score >= 75 ? "bg-green-500" : match.relevance_score >= 50 ? "bg-yellow-500" : "bg-gray-400"
            }`}
            style={{ width: `${match.relevance_score}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <div className="card p-3 lg:p-4">
          <p className="text-xs text-gray-500 uppercase">NAICS Code</p>
          <p className="text-sm font-medium mt-1">{rfp.naics_code || "N/A"}</p>
        </div>
        <div className="card p-3 lg:p-4">
          <p className="text-xs text-gray-500 uppercase">Set Aside</p>
          <p className="text-sm font-medium mt-1">{rfp.set_aside || "None"}</p>
        </div>
        <div className="card p-3 lg:p-4">
          <p className="text-xs text-gray-500 uppercase">Award Amount</p>
          <p className="text-sm font-medium mt-1">
            {rfp.award_amount ? `$${(rfp.award_amount / 1000000).toFixed(1)}M` : "N/A"}
          </p>
        </div>
        <div className="card p-3 lg:p-4">
          <p className="text-xs text-gray-500 uppercase">Posted</p>
          <p className="text-sm font-medium mt-1">
            {rfp.posted_date ? new Date(rfp.posted_date).toLocaleDateString() : "N/A"}
          </p>
        </div>
        <div className="card p-3 lg:p-4">
          <p className="text-xs text-gray-500 uppercase">Deadline</p>
          <p className="text-sm font-medium mt-1">
            {rfp.response_deadline ? new Date(rfp.response_deadline).toLocaleDateString() : "N/A"}
          </p>
        </div>
        <div className="card p-3 lg:p-4">
          <p className="text-xs text-gray-500 uppercase">Status</p>
          <p className="text-sm font-medium mt-1 capitalize">{rfp.status}</p>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">Description</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{rfp.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">Categories</h2>
          <div className="flex flex-wrap gap-1">
            {rfp.categories?.map((cat, i) => (
              <span key={i} className="tag-blue">{cat}</span>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">Requirements</h2>
          <ul className="space-y-1">
            {rfp.requirements?.map((req, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-gov-500 mt-0.5 shrink-0">•</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">Match Reasoning</h2>
        <div className="space-y-2">
          {match.match_reasons?.map((reason, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-green-500 mt-0.5 shrink-0">✓</span>
              <span>{reason}</span>
            </div>
          ))}
        </div>
        {match.score_breakdown && Object.keys(match.score_breakdown).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Score Breakdown</p>
            {Object.entries(match.score_breakdown).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span className="capitalize">{key.replace(/_/g, " ")}</span>
                <span className="font-medium">{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={() => onGenerateDraft(match)} className="btn-primary">
          Generate Draft
        </button>
        <button
          onClick={() => {
            const text = `Procura - RFP Opportunity\n\n${rfp.title}\n${rfp.agency}\nScore: ${match.relevance_score}/100\nDeadline: ${rfp.response_deadline}`;
            navigator.clipboard?.writeText(text);
          }}
          className="btn-secondary"
        >
          Copy Summary
        </button>
      </div>
    </div>
  );
}
