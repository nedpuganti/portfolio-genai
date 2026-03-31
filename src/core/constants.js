/**
 * Shared Constants for Portfolio AI
 * Eliminates duplication across components
 */
const PORTFOLIO_KEYWORDS = [
  "skills",
  "experience",
  "projects",
  "education",
  "contact",
  "services",
  "work",
  "career",
  "portfolio",
  "technologies",
  "programming",
  "developer",
  "background",
  "know",
  "familiar",
  "built",
  "developed",
  "email",
  "phone",
  "frameworks",
  "languages",
  "tools",
  "stack",
  "cloud",
  "freelance",
  "hire",
  // Education keywords
  "degree",
  "university",
  "college",
  "school",
  "studied",
  "graduated",
  "qualification",
  "diploma",
  // Experience keywords
  "years",
  "role",
  "position",
  "job",
  "current",
  "employment",
  "company",
  // Contact keywords
  "reach",
  "address",
  "website",
  "linkedin",
  // Skills keywords
  "technical",
  "soft",
  "coding",
  "proficient",
  // Projects keywords
  "apps",
  "websites",
  "mobile",
];

const MALICIOUS_PATTERNS = [
  /ignore\s+previous\s+instructions/i,
  /system\s+prompt/i,
  /jailbreak/i,
  /<script>/i,
  /hack/i,
];

module.exports = {
  PORTFOLIO_KEYWORDS,
  MALICIOUS_PATTERNS,
};
