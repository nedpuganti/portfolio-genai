const { BULLET_RESPONSE_PATTERNS } = require("./constants");

const BASE_RULES = [
  "You are Naren responding naturally to questions about your professional background.",
  "Answer in first person as if I am speaking directly to the visitor.",
  "Use I, me, and my. Do not refer to Naren in third person.",
  'Never say "Based on the data" or mention internal data sources.',
  "Use only the facts that appear in the provided portfolio data and context for this request.",
  'If a detail is not explicitly present in the portfolio data, say "I don\'t have that information."',
  'If the information is not available, say "I don\'t have that information."',
  "Do not invent experience, tools, projects, or credentials.",
  "Skip casual greetings and answer the question directly.",
  "Group related technologies together instead of listing random tools.",
];

function shouldUseBullets(question, toolSelection = {}) {
  if (toolSelection.prefersBullets) {
    return true;
  }

  return BULLET_RESPONSE_PATTERNS.some((pattern) => pattern.test(question));
}

function buildPrompt({
  question,
  relevantData,
  supplementalContext = "",
  conversationContext = "",
  toolSelection = {},
  repeatedQuestion = { isRepeated: false },
}) {
  const responseRules = shouldUseBullets(question, toolSelection)
    ? [
        "Respond with 4 to 6 concise bullet points.",
        "Keep each bullet focused on one idea.",
        "Avoid turning the answer into a single long paragraph.",
      ]
    : [
        "Respond in a concise paragraph, or use short bullets only if they improve clarity.",
      ];

  responseRules.push(
    "Sound like I am answering a real visitor to my portfolio, not like an assistant describing me.",
  );
  responseRules.push(
    "If the provided portfolio data contains a direct answer or a clearly related grouped match, answer from it directly.",
  );
  responseRules.push(
    'Only say "I don\'t have that information." when the requested detail is truly missing from the provided data.',
  );

  if (toolSelection.searchTerms?.length) {
    responseRules.push(
      `Focus on the most relevant details related to: ${toolSelection.searchTerms.join(", ")}.`,
    );
  }

  if (repeatedQuestion.isRepeated) {
    responseRules.push(
      "The user recently asked a similar question. Give a concise restatement and add a slightly different angle or more specific detail instead of refusing.",
    );
  }

  const sections = [
    `SYSTEM RULES:\n- ${BASE_RULES.join("\n- ")}`,
    `RESPONSE RULES:\n- ${responseRules.join("\n- ")}`,
  ];

  if (relevantData && Object.keys(relevantData).length > 0) {
    sections.push(
      `RELEVANT PORTFOLIO DATA:\n${JSON.stringify(relevantData, null, 2)}`,
    );
  }

  if (supplementalContext) {
    sections.push(`SUPPLEMENTAL CONTEXT:\n${supplementalContext}`);
  }

  if (conversationContext) {
    sections.push(`CONVERSATION CONTEXT:\n${conversationContext}`);
  }

  sections.push(`USER QUESTION:\n${question}`);
  sections.push("ANSWER:");

  return sections.join("\n\n");
}

module.exports = {
  buildPrompt,
  shouldUseBullets,
};
