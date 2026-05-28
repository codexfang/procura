const MOCK_USER = {
  id: "mock-user-001",
  email: "contractor@example.com",
  company_name: "Apex Government Solutions",
  industry: "information-technology",
  capabilities: [
    "Cloud Infrastructure",
    "Cybersecurity",
    "Data Analytics",
    "AI/ML Solutions",
    "IT Service Management",
  ],
  keywords: [
    "cloud migration",
    "zero trust",
    "FedRAMP",
    "AI automation",
    "data interoperability",
  ],
  tags: ["govtech", "defense", "healthcare", "enterprise-it"],
};

const MOCK_RFPS = [
  {
    id: "mock-rfp-001",
    title: "Enterprise Cloud Infrastructure Modernization Services",
    agency: "Department of Homeland Security",
    description:
      "The Department of Homeland Security seeks qualified vendors to provide enterprise cloud infrastructure modernization services, including migration planning, implementation, and ongoing management of cloud-based systems for mission-critical applications. The contractor will be responsible for assessing current infrastructure, developing migration strategies, executing cloud migrations, and providing post-migration support across multiple DHS components.",
    naics_code: "541512",
    set_aside: "Small Business",
    posted_date: "2026-05-15T10:00:00Z",
    response_deadline: "2026-06-29T17:00:00Z",
    award_amount: 12000000,
    status: "open",
    categories: ["cloud", "infrastructure", "cybersecurity", "IT services"],
    requirements: [
      "SOC 2 compliance",
      "FedRAMP certification",
      "CMMC Level 3",
      "Active TS/SCI clearance for lead personnel",
    ],
  },
  {
    id: "mock-rfp-002",
    title: "AI-Powered Document Processing and Workflow Automation Platform",
    agency: "General Services Administration",
    description:
      "GSA requires an AI-powered document processing and workflow automation platform capable of handling large volumes of government forms, extracting structured data, and integrating with existing federal record management systems. The solution must support multiple document formats and provide real-time processing capabilities.",
    naics_code: "541511",
    set_aside: "8(a)",
    posted_date: "2026-05-12T08:00:00Z",
    response_deadline: "2026-07-11T17:00:00Z",
    award_amount: 8000000,
    status: "open",
    categories: ["AI", "machine learning", "document processing", "automation"],
    requirements: [
      "FedRAMP Moderate",
      "Section 508 compliance",
      "FIPS 140-2",
      "API-first architecture",
    ],
  },
  {
    id: "mock-rfp-003",
    title: "Cybersecurity Risk Assessment and Penetration Testing Services",
    agency: "Department of Defense",
    description:
      "The DoD is seeking cybersecurity risk assessment and penetration testing services for its network infrastructure, including vulnerability assessments, threat modeling, and remediation planning across classified and unclassified environments.",
    naics_code: "541690",
    set_aside: "Service-Disabled Veteran-Owned",
    posted_date: "2026-05-10T09:00:00Z",
    response_deadline: "2026-06-09T17:00:00Z",
    award_amount: 5000000,
    status: "open",
    categories: ["cybersecurity", "penetration testing", "risk assessment", "defense"],
    requirements: [
      "Top Secret clearance",
      "CISSP-certified staff",
      "NIST SP 800-53 compliance",
    ],
  },
  {
    id: "mock-rfp-004",
    title: "Healthcare Data Interoperability and FHIR API Integration Platform",
    agency: "Department of Veterans Affairs",
    description:
      "The VA requires a healthcare data interoperability platform using FHIR standards to enable seamless data exchange between VA medical facilities, community care providers, and third-party health applications.",
    naics_code: "541512",
    set_aside: "Small Business",
    posted_date: "2026-05-08T11:00:00Z",
    response_deadline: "2026-06-27T17:00:00Z",
    award_amount: 10000000,
    status: "open",
    categories: ["healthcare", "data interoperability", "FHIR", "API"],
    requirements: [
      "HIPAA compliance",
      "FHIR R4 certification",
      "HITRUST CSF",
    ],
  },
  {
    id: "mock-rfp-005",
    title: "Zero Trust Architecture Implementation and Network Modernization",
    agency: "Department of Energy",
    description:
      "The DOE is seeking vendors to design and implement a Zero Trust Architecture across its national laboratory network, including identity management, micro-segmentation, continuous monitoring, and automated threat response.",
    naics_code: "541512",
    set_aside: "Small Business",
    posted_date: "2026-05-05T10:00:00Z",
    response_deadline: "2026-06-29T17:00:00Z",
    award_amount: 15000000,
    status: "open",
    categories: ["zero trust", "network security", "identity management", "cybersecurity"],
    requirements: [
      "Zero Trust Maturity Model expertise",
      "FedRAMP High",
      "NIST 800-207",
    ],
  },
];

function calculateMockScore(rfp, user) {
  let score = 0;
  const reasons = [];
  const keywordMatches = [];
  const capabilityMatches = [];
  const breakdown = {};

  const text = `${rfp.title} ${rfp.description} ${rfp.categories.join(" ")}`.toLowerCase();

  let ks = 0;
  for (const kw of user.keywords) {
    if (text.includes(kw.toLowerCase())) {
      keywordMatches.push(kw);
      ks += 15;
    }
  }
  ks = Math.min(ks, 35);
  breakdown.keyword_match = ks;
  score += ks;
  if (keywordMatches.length) reasons.push(`Keywords matched: ${keywordMatches.slice(0, 3).join(", ")}`);

  let cs = 0;
  for (const cap of user.capabilities) {
    if (text.includes(cap.toLowerCase())) {
      capabilityMatches.push(cap);
      cs += 12;
    }
  }
  cs = Math.min(cs, 30);
  breakdown.capability_match = cs;
  score += cs;
  if (capabilityMatches.length) reasons.push(`Capabilities matched: ${capabilityMatches.slice(0, 3).join(", ")}`);

  if (user.industry && rfp.categories.some((c) => c.includes(user.industry.replace("-", " ")))) {
    breakdown.industry_match = 10;
    score += 10;
    reasons.push("Industry category matches");
  }

  if (rfp.award_amount) {
    const as = Math.min((rfp.award_amount / 500000) * 2, 10);
    breakdown.award_potential = as;
    score += as;
  }

  if (rfp.set_aside && user.capabilities.length) {
    breakdown.set_aside = 5;
    score += 5;
  }

  return {
    relevance_score: Math.round(Math.min(score, 100)),
    match_reasons: reasons,
    keyword_matches: keywordMatches,
    capability_matches: capabilityMatches,
    score_breakdown: breakdown,
  };
}

const MOCK_MATCHES = MOCK_RFPS.map((rfp, i) => {
  const result = calculateMockScore(rfp, MOCK_USER);
  return {
    id: `mock-match-${String(i + 1).padStart(3, "0")}`,
    user_id: MOCK_USER.id,
    rfp_id: rfp.id,
    ...result,
    status: i === 0 ? "reviewed" : "pending",
    is_read: i < 2,
    rfp,
    created_at: new Date(
      Date.now() - (MOCK_RFPS.length - i) * 86400000
    ).toISOString(),
    updated_at: new Date().toISOString(),
  };
});

const MOCK_DRAFTS = MOCK_RFPS.slice(0, 3).map((rfp, i) => ({
  id: `mock-draft-${String(i + 1).padStart(3, "0")}`,
  user_id: MOCK_USER.id,
  rfp_id: rfp.id,
  match_id: `mock-match-${String(i + 1).padStart(3, "0")}`,
  overview: `Proposal response for ${rfp.title} issued by ${rfp.agency}.`,
  capability_mapping: MOCK_USER.capabilities.reduce((acc, cap) => {
    acc[cap] = {
      matched_categories: rfp.categories.filter(
        (c) => cap.toLowerCase().includes(c) || c.includes(cap.toLowerCase())
      ),
      relevance: "high",
    };
    return acc;
  }, {}),
  compliance_checklist: rfp.requirements.map((req) => ({
    requirement: req,
    status: "not_addressed",
    notes: "",
  })),
  suggested_sections: [
    { heading: "Executive Summary", prompt: "Summarize qualifications and approach.", content: "" },
    { heading: "Technical Approach", prompt: "Describe methodology.", content: "" },
    { heading: "Capability Statement", prompt: "Detail relevant experience.", content: "" },
    { heading: "Key Personnel", prompt: "List qualified staff.", content: "" },
    { heading: "Project Management Plan", prompt: "Outline timeline and deliverables.", content: "" },
    { heading: "Compliance Matrix", prompt: "Map requirements to approach.", content: "" },
  ],
  full_draft: null,
  status: "draft",
  source: "template",
  is_edited: false,
  rfp,
  created_at: new Date(
    Date.now() - (3 - i) * 86400000
  ).toISOString(),
  updated_at: new Date().toISOString(),
}));

export const mockData = {
  user: MOCK_USER,
  rfps: MOCK_RFPS,
  matches: MOCK_MATCHES,
  drafts: MOCK_DRAFTS,
};
