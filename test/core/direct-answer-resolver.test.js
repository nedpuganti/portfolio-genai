const test = require("node:test");
const assert = require("node:assert/strict");

const { PortfolioTools } = require("../../src/core/tools");
const { resolveDirectAnswer } = require("../../src/core/direct-answer-resolver");

function buildToolData() {
  const tools = new PortfolioTools();

  return {
    summary: tools.getSummary(),
    services: tools.getServices(),
    experience: tools.getExperience(),
    stats: tools.getStats(),
  };
}

test("direct answer resolver handles React questions using grounded adjacent stack data", () => {
  const answer = resolveDirectAnswer(
    "Tell me about your React experience",
    buildToolData(),
  );

  assert.match(answer, /don't list direct React experience/i);
  assert.match(answer, /Angular/i);
});

test("direct answer resolver explains missing Node.js-specific year counts", () => {
  const answer = resolveDirectAnswer(
    "How many years of Node.js experience do you have?",
    buildToolData(),
  );

  assert.match(answer, /Node\.js/i);
  assert.match(answer, /overall experience/i);
});

test("direct answer resolver handles missing certifications explicitly", () => {
  const answer = resolveDirectAnswer(
    "Do you have any certifications?",
    buildToolData(),
  );

  assert.equal(
    answer,
    "I do not currently list any formal certifications in my portfolio.",
  );
});

test("direct answer resolver handles freelance availability with grounded availability text", () => {
  const answer = resolveDirectAnswer(
    "Are you available for freelance work?",
    buildToolData(),
  );

  assert.match(answer, /Available for frontend, platform UI, and product engineering opportunities/i);
  assert.match(answer, /do not explicitly label that as freelance/i);
});
