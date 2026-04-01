function findService(services = [], name) {
  return Array.isArray(services)
    ? services.find((service) => service.name === name)
    : null;
}

function getServiceTypes(services, name) {
  return findService(services, name)?.types || [];
}

function formatList(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function hasExplicitTech(toolData = {}, pattern) {
  return JSON.stringify(toolData).match(pattern);
}

function getYearsExperience(toolData = {}) {
  const yearsEntry = Array.isArray(toolData.stats)
    ? toolData.stats.find((item) => item.name === "Years Experience")
    : null;

  return yearsEntry?.value || null;
}

function buildReactAnswer(toolData = {}) {
  const frontendTypes = getServiceTypes(toolData.services, "Web/Frontend Development");
  const mobileTypes = getServiceTypes(toolData.services, "Mobile Development");
  const frontendSummary = formatList(frontendTypes) || "Angular, JavaScript/TypeScript, Nx, and Astro";
  const mobileSummary = formatList(mobileTypes) || "Apache Cordova, Ionic Framework, and Flutter";

  return `I don't list direct React experience in my portfolio. My frontend work is centered on ${frontendSummary}, and my mobile work includes ${mobileSummary}.`;
}

function buildObservabilityAnswer(toolData = {}) {
  const tools = getServiceTypes(toolData.services, "Other Tools").filter((item) =>
    /elk|grafana/i.test(item),
  );

  if (tools.length === 0) {
    return null;
  }

  return `My portfolio highlights ${formatList(tools)} for observability-related work. It doesn't include a longer write-up of my monitoring approach, but those are the logging and analytics tools I list.`;
}

function buildIndustriesAnswer(toolData = {}) {
  const experience = Array.isArray(toolData.experience) ? toolData.experience : [];
  const organizations = experience
    .map((item) => item.where)
    .filter(Boolean);

  if (organizations.length === 0) {
    return null;
  }

  return `My portfolio highlights work with ${formatList(organizations)}, but it does not explicitly categorize those roles by industry.`;
}

function buildNodeYearsAnswer(toolData = {}) {
  const yearsExperience = getYearsExperience(toolData);

  if (!hasExplicitTech(toolData, /node(\.js)?/i)) {
    return null;
  }

  if (yearsExperience) {
    return `I list Node.js as part of my backend stack, and I have ${yearsExperience}+ years of overall experience, but my portfolio does not break out a separate Node.js-only year count.`;
  }

  return "I list Node.js as part of my backend stack, but my portfolio does not break out a separate Node.js-only year count.";
}

function buildAvailabilityAnswer(toolData = {}) {
  const availability = toolData.summary?.professional?.availability;
  if (!availability) {
    return null;
  }

  return `${availability} I do not explicitly label that as freelance availability in my portfolio.`;
}

function resolveDirectAnswer(question, toolData = {}) {
  if (/\breact\b/i.test(question) && !hasExplicitTech(toolData, /\breact\b/i)) {
    return buildReactAnswer(toolData);
  }

  if (/\b(observability|monitoring|logging|analytics)\b/i.test(question)) {
    return buildObservabilityAnswer(toolData);
  }

  if (/\bindustr(?:y|ies)\b/i.test(question)) {
    return buildIndustriesAnswer(toolData);
  }

  if (/\bnode(\.js)?\b/i.test(question) && /\byears?\b/i.test(question)) {
    return buildNodeYearsAnswer(toolData);
  }

  if (/\be-?commerce\b/i.test(question)) {
    return "I do not have any projects explicitly labeled as e-commerce in my portfolio.";
  }

  if (/\bcertification|certifications\b/i.test(question)) {
    return "I do not currently list any formal certifications in my portfolio.";
  }

  if (/\bfreelance\b/i.test(question)) {
    return buildAvailabilityAnswer(toolData);
  }

  if (/\bconsult(ing)?\b/i.test(question)) {
    return "My listed services focus on product, frontend, backend, mobile, platform, and DevOps work. I do not explicitly list consulting as a separate service.";
  }

  if (/\bmaintenance\b/i.test(question)) {
    return "I do not explicitly list maintenance as a separate service in my portfolio.";
  }

  if (/\bremote|remotely\b/i.test(question)) {
    return "I do not explicitly state remote-work availability in my portfolio.";
  }

  if (/\bhourly rate|rate\b/i.test(question)) {
    return "I do not publish an hourly rate in my portfolio.";
  }

  return null;
}

module.exports = {
  resolveDirectAnswer,
};
