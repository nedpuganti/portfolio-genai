const test = require("node:test");
const assert = require("node:assert/strict");

const { ToolSelector } = require("../../src/core/tool-selector");

test("tool selector expands platform questions into relevant tools and search terms", () => {
  const selector = new ToolSelector();

  const selection = selector.getRelevantTools(
    "Can you summarize your platform engineering stack across AWS, Kubernetes, and Kafka?",
  );

  assert.equal(selection.isBroadQuery, true);
  assert.equal(selection.prefersBullets, true);
  assert.equal(selection.tools.includes("summary"), true);
  assert.equal(selection.tools.includes("skills"), true);
  assert.equal(selection.tools.includes("services"), true);
  assert.equal(selection.tools.includes("experience"), true);
  assert.deepEqual(selection.searchTerms, [
    "platform engineering",
    "aws",
    "kubernetes",
    "kafka",
  ]);
});

test("tool selector falls back to a general summary bundle for broad role questions", () => {
  const selector = new ToolSelector();

  const selection = selector.getRelevantTools("What do you do day to day?");

  assert.equal(selection.tools.includes("summary"), true);
  assert.equal(selection.tools.includes("experience"), true);
});

test("tool selector adds contact and summary tools for hire and availability questions", () => {
  const selector = new ToolSelector();

  const selection = selector.getRelevantTools("How can I hire you?");

  assert.equal(selection.tools.includes("services"), true);
  assert.equal(selection.tools.includes("contact"), true);
  assert.equal(selection.tools.includes("summary"), true);
});

test("tool selector captures stats for metrics questions", () => {
  const selector = new ToolSelector();

  const selection = selector.getRelevantTools("Show me your portfolio metrics");

  assert.equal(selection.tools.includes("stats"), true);
});
