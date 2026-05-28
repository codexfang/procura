import { useState, useEffect } from "react";
import DraftSection from "../components/DraftSection";
import LoadingSpinner from "../components/LoadingSpinner";
import { mockData } from "../utils/mockData";

export default function DraftViewer({ backendOnline, api, draftId, matchId, onBack }) {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDraft();
  }, [draftId, backendOnline]);

  async function loadDraft() {
    setLoading(true);
    try {
      if (backendOnline && draftId && !draftId.startsWith("mock-")) {
        const data = await api.drafts.get(draftId);
        setDraft(data);
      } else if (matchId) {
        const found = mockData.drafts.find(
          (d) => d.match_id === matchId || d.rfp_id === matchId
        );
        setDraft(found || mockData.drafts[0]);
      } else {
        setDraft(mockData.drafts[0]);
      }
    } catch {
      setDraft(mockData.drafts[0]);
    } finally {
      setLoading(false);
    }
  }

  function handleSectionChange(heading, content) {
    if (!draft) return;
    setDraft({
      ...draft,
      suggested_sections: draft.suggested_sections.map((s) =>
        s.heading === heading ? { ...s, content } : s
      ),
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (backendOnline && draft && !draft.id.startsWith("mock-")) {
        await api.drafts.update(draft.id, {
          suggested_sections: draft.suggested_sections,
          overview: draft.overview,
        });
      }
    } catch {}
    setSaving(false);
  }

  function handleExport() {
    if (!draft) return;
    const text = [
      `Draft: ${draft.rfp?.title || "Untitled"}`,
      `Agency: ${draft.rfp?.agency || "N/A"}`,
      "",
      "Overview",
      draft.overview || "",
      "",
      ...(draft.suggested_sections || []).map(
        (s) => `${s.heading}\n${s.content || ""}\n`
      ),
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `procura-draft-${draft.rfp?.title?.slice(0, 30).replace(/\s+/g, "-").toLowerCase() || "draft"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) return <LoadingSpinner message="Loading draft..." />;
  if (!draft) return <div className="card p-8 text-center text-gray-500">Draft not found.</div>;

  const rfp = draft.rfp;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Proposal Draft</h1>
          {rfp && <p className="text-sm text-gray-500 mt-1">{rfp.title}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`tag ${draft.source === "ai_generated" ? "tag-green" : "tag-gray"}`}>
            {draft.source === "ai_generated" ? "AI Generated" : "Template"}
          </span>
          <span className={`tag ${draft.status === "draft" ? "tag-blue" : "tag-green"}`}>
            {draft.status}
          </span>
        </div>
      </div>

      {draft.full_draft && (
        <div className="card p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">AI-Generated Full Draft</h2>
          <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
            {draft.full_draft}
          </div>
        </div>
      )}

      <div className="card p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">Overview</h2>
        <textarea
          className="input-field min-h-[80px] resize-y text-sm"
          value={draft.overview || ""}
          onChange={(e) => setDraft({ ...draft, overview: e.target.value })}
        />
      </div>

      {draft.capability_mapping && Object.keys(draft.capability_mapping).length > 0 && (
        <div className="card p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">Capability Mapping</h2>
          <div className="space-y-2">
            {Object.entries(draft.capability_mapping).map(([cap, mapping]) => (
              <div key={cap} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{cap}</span>
                <span className={`tag ${mapping.relevance === "high" ? "tag-green" : "tag-gray"}`}>
                  {mapping.relevance}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {draft.compliance_checklist && draft.compliance_checklist.length > 0 && (
        <div className="card p-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">Compliance Checklist</h2>
          <div className="space-y-1">
            {draft.compliance_checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-gov-600 focus:ring-gov-500"
                  checked={item.status === "addressed"}
                  onChange={() => {
                    const updated = [...draft.compliance_checklist];
                    updated[i] = {
                      ...updated[i],
                      status: item.status === "addressed" ? "not_addressed" : "addressed",
                    };
                    setDraft({ ...draft, compliance_checklist: updated });
                  }}
                />
                <span className={item.status === "addressed" ? "line-through text-gray-400" : ""}>
                  {item.requirement}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {draft.suggested_sections && draft.suggested_sections.length > 0 && (
        <div className="space-y-3 mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Response Sections</h2>
          {draft.suggested_sections.map((section, i) => (
            <DraftSection
              key={i}
              heading={section.heading}
              content={section.content || ""}
              onChange={handleSectionChange}
            />
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button onClick={handleExport} className="btn-secondary">
          Export Text
        </button>
        <button
          onClick={() => {
            const text = draft.overview || "";
            navigator.clipboard?.writeText(text);
          }}
          className="btn-secondary"
        >
          Copy Overview
        </button>
      </div>
    </div>
  );
}
