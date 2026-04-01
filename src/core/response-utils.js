function normalizeWhitespace(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function summarizeForMemory(text, maxLength = 160) {
  const normalized = normalizeWhitespace(text);

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

function extractTextFromModelResult(result) {
  const candidates = Array.isArray(result?.candidates) ? result.candidates : [];

  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts)
      ? candidate.content.parts
      : [];

    const text = parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();

    if (text) {
      return text;
    }
  }

  return null;
}

module.exports = {
  extractTextFromModelResult,
  normalizeWhitespace,
  summarizeForMemory,
};
