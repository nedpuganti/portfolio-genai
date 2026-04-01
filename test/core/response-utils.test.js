const test = require("node:test");
const assert = require("node:assert/strict");

const {
  extractTextFromModelResult,
  summarizeForMemory,
} = require("../../src/core/response-utils");

test("response parser concatenates text parts safely", () => {
  const text = extractTextFromModelResult({
    candidates: [
      {
        content: {
          parts: [{ text: "Hello " }, { text: "world" }],
        },
      },
    ],
  });

  assert.equal(text, "Hello world");
});

test("response parser returns null for empty model payloads", () => {
  assert.equal(extractTextFromModelResult({}), null);
});

test("memory summarizer trims long whitespace-heavy responses", () => {
  const summary = summarizeForMemory(
    "Node.js   and   platform systems   with API integrations and release workflows",
    40,
  );

  assert.equal(summary, "Node.js and platform systems with API...");
});
