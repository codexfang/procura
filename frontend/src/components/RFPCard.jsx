export default function RFPCard({ match, onSelect }) {
  const { rfp, relevance_score, match_reasons, status } = match;
  if (!rfp) return null;

  const scoreColor =
    relevance_score >= 75
      ? "bg-green-500"
      : relevance_score >= 50
      ? "bg-yellow-500"
      : "bg-gray-400";

  const daysLeft = rfp.response_deadline
    ? Math.ceil(
        (new Date(rfp.response_deadline) - new Date()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div
      onClick={() => onSelect?.(match)}
      className="card p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4"
      style={{
        borderLeftColor:
          relevance_score >= 75
            ? "#22c55e"
            : relevance_score >= 50
            ? "#eab308"
            : "#9ca3af",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {!match.is_read && (
              <span className="w-2 h-2 rounded-full bg-gov-500 shrink-0" />
            )}
            <h3 className="font-medium text-gray-900 truncate">{rfp.title}</h3>
          </div>
          <p className="text-sm text-gray-500 mb-2">{rfp.agency}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-gray-900">{relevance_score}</div>
          <div className="text-xs text-gray-500">/100</div>
        </div>
      </div>

      <div className="mt-3">
        <div className="score-bar">
          <div
            className={`score-fill ${scoreColor}`}
            style={{ width: `${relevance_score}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
        {daysLeft !== null && (
          <span className={daysLeft <= 14 ? "text-red-600 font-medium" : ""}>
            {daysLeft} days remaining
          </span>
        )}
        {rfp.award_amount && (
          <span>${(rfp.award_amount / 1000000).toFixed(1)}M</span>
        )}
        <span className={`tag ${status === "reviewed" ? "tag-green" : "tag-gray"}`}>
          {status}
        </span>
      </div>

      {match_reasons && match_reasons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {match_reasons.slice(0, 2).map((reason, i) => (
            <span key={i} className="tag-blue">
              {reason}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
