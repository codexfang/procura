const AGENCIES = [
  "Department of Homeland Security", "Department of Defense", "General Services Administration",
  "Department of Veterans Affairs", "Department of Energy", "Department of the Treasury",
  "Department of Health and Human Services", "Department of Transportation", "Department of Commerce",
  "Department of Justice", "Department of State", "Department of the Interior",
  "Department of Agriculture", "Department of Education", "National Aeronautics and Space Administration",
  "National Security Agency", "Federal Bureau of Investigation", "Environmental Protection Agency",
  "Social Security Administration", "National Institutes of Health",
];

const CATEGORIES = [
  ["cloud", "infrastructure", "cybersecurity", "IT services"],
  ["AI", "machine learning", "document processing", "automation"],
  ["cybersecurity", "penetration testing", "risk assessment", "defense"],
  ["healthcare", "data interoperability", "FHIR", "API"],
  ["geospatial", "intelligence", "data analytics", "satellite"],
  ["ITSM", "help desk", "ITIL", "service management"],
  ["zero trust", "network security", "identity management", "cybersecurity"],
  ["data analytics", "business intelligence", "reporting", "dashboards"],
  ["software development", "DevSecOps", "agile", "microservices"],
  ["network", "telecommunications", "5G", "broadband"],
  ["training", "workforce development", "e-learning", "simulation"],
  ["cloud migration", "AWS", "Azure", "GCP"],
  ["IoT", "sensors", "edge computing", "industrial control"],
  ["blockchain", "distributed ledger", "smart contracts", "supply chain"],
  ["robotics", "automation", "RPA", "process optimization"],
];

const REQUIREMENTS_POOL = [
  "FedRAMP Moderate", "FedRAMP High", "SOC 2 Type II", "ISO 27001",
  "HIPAA compliance", "NIST SP 800-53", "NIST SP 800-171", "CMMC Level 2",
  "Section 508 compliance", "Top Secret clearance", "TS/SCI clearance",
  "ITIL 4 certification", "FIPS 140-2", "HITRUST CSF", "FISMA compliance",
];

const MODIFIERS = [
  "Enterprise", "Advanced", "Integrated", "Secure", "Automated",
  "Cloud-Native", "AI-Enabled", "Real-Time", "Comprehensive", "Modernized",
];

const FOCUS = [
  "Infrastructure", "Operations", "Platform", "Management", "Analytics",
  "Integration", "Automation", "Monitoring", "Migration", "Support",
];

const DESCRIPTIONS = [
  "Seeks qualified vendors to provide comprehensive solutions supporting mission-critical operations across multiple facilities nationwide.",
  "Requires advanced capabilities to enhance operational efficiency and maintain compliance with federal standards.",
  "Announces this solicitation for integrated services to address critical requirements across the enterprise environment.",
  "Seeks proposals for a scalable platform to enhance core capabilities and support future mission growth.",
  "Requires proven experience delivering complex solutions in federal environments with strict security and compliance requirements.",
];

function seededRandom(seed) {
  let s = seed * 9301 + 49297;
  s = ((s << 13) ^ s) >>> 0;
  return (s % 10000) / 10000;
}

function pick(arr, seed) {
  return arr[Math.floor(seededRandom(seed) * arr.length)];
}

function pickN(arr, n, seed) {
  const shuffled = [...arr].sort((a, b) => seededRandom(seed + a.length) - 0.5);
  return shuffled.slice(0, n);
}

const MOCK_RFPS = Array.from({ length: 105 }, (_, i) => {
  const seed = i * 7919 + 42;
  const agency = pick(AGENCIES, seed);
  const cats = pick(CATEGORIES, seed + 1);
  const deadlineDays = Math.floor(seededRandom(seed + 2) * 76) + 14;
  const awardAmount = Math.floor(seededRandom(seed + 3) * 20000000) + 500000;
  const modifier = pick(MODIFIERS, seed + 4);
  const focus = pick(FOCUS, seed + 5);
  const postedDaysAgo = Math.floor(seededRandom(seed + 6) * 60) + 1;

  return {
    id: `mock-rfp-${String(i + 1).padStart(4, "0")}`,
    title: `${modifier} ${cats[0].charAt(0).toUpperCase() + cats[0].slice(1)} ${focus} Platform - ${agency.split(" ").pop()}`,
    agency,
    description: `The ${agency} ${pick(DESCRIPTIONS, seed + 7)}`,
    naics_code: pick(["541512", "541511", "541690", "541519", "541360", "541330", "541990"], seed + 8),
    set_aside: pick(["Small Business", "8(a)", "Service-Disabled Veteran-Owned", "HUBZone", "Women-Owned Small Business", null], seed + 9),
    posted_date: new Date(Date.now() - postedDaysAgo * 86400000).toISOString(),
    response_deadline: new Date(Date.now() + deadlineDays * 86400000).toISOString(),
    award_amount: awardAmount,
    status: pick(["open", "open", "open", "open", "closed", "awarded"], seed + 10),
    categories: cats,
    requirements: pickN(REQUIREMENTS_POOL, Math.floor(seededRandom(seed + 11) * 3) + 2, seed + 12),
  };
});

const MOCK_USER = {
  id: "mock-user-001",
  email: "contractor@example.com",
  company_name: "Apex Government Solutions",
  industry: "information-technology",
  capabilities: [
    "Cloud Infrastructure", "Cybersecurity", "Data Analytics",
    "AI/ML Solutions", "IT Service Management", "Network Engineering",
  ],
  keywords: [
    "cloud migration", "zero trust", "FedRAMP", "AI automation",
    "data interoperability", "DevSecOps", "machine learning",
  ],
  tags: ["govtech", "defense", "healthcare", "enterprise-it"],
};

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
    id: `mock-match-${String(i + 1).padStart(4, "0")}`,
    user_id: MOCK_USER.id,
    rfp_id: rfp.id,
    ...result,
    status: i < 5 ? "reviewed" : "pending",
    is_read: i < 10,
    rfp,
    created_at: new Date(Date.now() - (MOCK_RFPS.length - i) * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  };
});

const MOCK_DRAFTS = MOCK_RFPS.slice(0, 5).map((rfp, i) => ({
  id: `mock-draft-${String(i + 1).padStart(4, "0")}`,
  user_id: MOCK_USER.id,
  rfp_id: rfp.id,
  match_id: `mock-match-${String(i + 1).padStart(4, "0")}`,
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
  created_at: new Date(Date.now() - (3 - i) * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
}));

export const mockData = {
  user: MOCK_USER,
  rfps: MOCK_RFPS,
  matches: MOCK_MATCHES,
  drafts: MOCK_DRAFTS,
};
