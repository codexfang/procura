import { useState, useEffect } from "react";
import DraftSection from "../components/DraftSection";
import LoadingSpinner from "../components/LoadingSpinner";
import { mockData } from "../utils/mockData";

const SECTION_GENERATORS = {
  "Executive Summary": (rfp) =>
    `Our organization brings extensive experience delivering solutions to ${rfp.agency || "federal agencies"}. We fully understand the requirements outlined in this opportunity for ${rfp.title || "federal contracting services"} and have assembled a team with the precise qualifications needed to ensure successful execution. Our proposed approach aligns with federal best practices and leverages proven methodologies.`,
  "Technical Approach": (rfp) =>
    `Our technical approach for ${rfp.title || "this engagement"} follows industry best practices and federal standards. We will employ an agile methodology with iterative delivery milestones, ensuring continuous stakeholder engagement and rapid response to evolving requirements. Our solution architecture emphasizes scalability, security, and interoperability with existing systems.`,
  "Capability Statement": (rfp) =>
    `We have proven experience delivering similar solutions for federal agencies, including: (1) successful implementation of enterprise-scale systems with 99.9% uptime, (2) certified personnel with relevant clearances and credentials, (3) established partnerships with leading technology vendors, and (4) a track record of on-time, on-budget delivery for contracts of comparable size and complexity to this ${rfp.agency || "federal"} opportunity.`,
  "Key Personnel": (rfp) =>
    `Our proposed team includes: (1) Program Manager with PMP certification and 15+ years of federal contracting experience, (2) Technical Lead with relevant architecture and implementation expertise, (3) Security Officer with CISSP certification and FedRAMP experience, (4) Quality Assurance Manager ensuring deliverables meet all specified requirements and standards. Detailed resumes available upon request.`,
  "Project Management Plan": (rfp) =>
    `Our project management approach follows PMI best practices and includes: (1) detailed work breakdown structure with milestones and deliverables, (2) monthly status reports and quarterly performance reviews, (3) risk management plan with identified mitigation strategies, (4) change control process for scope modifications, (5) communication plan ensuring stakeholder alignment throughout the project lifecycle.`,
  "Compliance Matrix": (rfp) =>
    `The following compliance requirements have been identified for this opportunity. Our approach ensures full compliance with each requirement through established policies, procedures, and verified controls. Detailed evidence of compliance will be provided during the evaluation process.`,
  "Past Performance": (rfp) =>
    `We have successfully delivered similar projects for federal clients, including: (1) a $5M enterprise IT modernization for a cabinet-level agency completed ahead of schedule, (2) a cybersecurity assessment program for the Department of Defense covering 50+ systems, (3) a cloud migration initiative for a federal health agency processing 1M+ transactions daily. References available upon request.`,
};

function generateSectionContent(heading, rfp) {
  const gen = SECTION_GENERATORS[heading];
  return gen ? gen(rfp) : "";
}

function buildComplianceChecklist(rfp) {
  const reqs = rfp.requirements || [];
  return reqs.map((req) => ({
    requirement: req,
    status: "not_addressed",
    notes: `We maintain established processes and controls to address ${req} requirements. Detailed compliance evidence will be provided in the final submission.`,
  }));
}

function generateDraftFromMatch(match) {
  const rfp = match.rfp || {};
  const sections = Object.keys(SECTION_GENERATORS).map((heading) => ({
    heading,
    prompt: `Write ${heading.toLowerCase()} content...`,
    content: generateSectionContent(heading, rfp),
  }));

  return {
    id: "generated-" + Date.now(),
    user_id: "local",
    rfp_id: rfp.id || "",
    match_id: match.id || "",
    overview: `${rfp.agency || "The agency"} requires a strategic partner for ${rfp.title || "this opportunity"}. We submit this proposal demonstrating our qualifications, approach, and commitment to delivering exceptional results. Our team has the experience, certifications, and resources to meet or exceed all requirements outlined in this solicitation.`,
    capability_mapping: {},
    compliance_checklist: buildComplianceChecklist(rfp),
    suggested_sections: sections,
    full_draft: null,
    status: "draft",
    source: "template",
    is_edited: false,
    rfp,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export default function DraftViewer({ backendOnline, api, draftId, matchId, onBack }) {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDraft();
  }, [draftId, matchId, backendOnline]);

  async function loadDraft() {
    setLoading(true);
    try {
      if (backendOnline && draftId && !draftId.startsWith("mock-") && !draftId.startsWith("generated-")) {
        const data = await api.drafts.get(draftId);
        setDraft(data);
      } else if (matchId) {
        const found = mockData.drafts.find(
          (d) => d.match_id === matchId || d.rfp_id === matchId
        );
        if (found) {
          setDraft(found);
        } else {
          const match = mockData.matches.find((m) => m.id === matchId);
          setDraft(generateDraftFromMatch(match || mockData.matches[0]));
        }
      } else {
        setDraft(mockData.drafts[0] || generateDraftFromMatch(mockData.matches[0]));
      }
    } catch {
      const match = mockData.matches.find((m) => m.id === matchId);
      setDraft(generateDraftFromMatch(match || mockData.matches[0]));
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

  function handleChecklistToggle(index) {
    if (!draft) return;
    const updated = [...draft.compliance_checklist];
    updated[index] = {
      ...updated[index],
      status: updated[index].status === "addressed" ? "not_addressed" : "addressed",
    };
    setDraft({ ...draft, compliance_checklist: updated });
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (backendOnline && draft && !draft.id.startsWith("mock-") && !draft.id.startsWith("generated-")) {
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
    a.download = `procura-draft-${(draft.rfp?.title || "draft").slice(0, 30).replace(/\s+/g, "-").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (!draftId && !matchId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <h2 className="text-lg font-medium text-gray-500 mb-1">No Draft Selected</h2>
        <p className="text-sm text-gray-400">Select an RFP from the Dashboard and click "Generate Draft" to create a proposal draft.</p>
        <button onClick={onBack} className="btn-primary mt-4">Go to Dashboard</button>
      </div>
    );
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
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900">Proposal Draft</h1>
          {rfp && <p className="text-sm text-gray-500 mt-1 truncate">{rfp.title}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`tag ${draft.source === "ai_generated" ? "tag-green" : "tag-gray"}`}>
            {draft.source === "ai_generated" ? "AI" : "Template"}
          </span>
          <span className="tag-blue">{draft.status}</span>
        </div>
      </div>

      {draft.full_draft && (
        <div className="card p-3 sm:p-4 mb-3 sm:mb-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">AI-Generated Full Draft</h2>
          <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed break-words">
            {draft.full_draft}
          </div>
        </div>
      )}

      <div className="card p-3 sm:p-4 mb-3 sm:mb-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">Overview</h2>
        <textarea
          className="input-field min-h-[80px] resize-y text-sm"
          value={draft.overview || ""}
          onChange={(e) => setDraft({ ...draft, overview: e.target.value })}
        />
      </div>

      {draft.compliance_checklist && draft.compliance_checklist.length > 0 && (
        <div className="card p-3 sm:p-4 mb-3 sm:mb-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">Compliance Checklist</h2>
          <div className="space-y-3">
            {draft.compliance_checklist.map((item, i) => (
              <div key={i} className="border border-gray-100 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-gov-600 focus:ring-gov-500 shrink-0 mt-0.5"
                    checked={item.status === "addressed"}
                    onChange={() => handleChecklistToggle(i)}
                  />
                  <div>
                    <p className={`text-sm font-medium ${item.status === "addressed" ? "line-through text-gray-400" : "text-gray-700"}`}>
                      {item.requirement}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{item.notes}</p>
                  </div>
                </div>
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

      <div className="flex flex-wrap gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button onClick={handleExport} className="btn-secondary">
          Export Text
        </button>
        <button
          onClick={() => navigator.clipboard?.writeText(draft.overview || "")}
          className="btn-secondary"
        >
          Copy Overview
        </button>
      </div>
    </div>
  );
}
