const test = require("node:test");
const assert = require("node:assert/strict");

const { buildPrompt } = require("../../src/core/prompts");

test("prompt enforces first-person, portfolio-data-only responses", () => {
  const prompt = buildPrompt({
    question: "Tell me about your backend work",
    relevantData: {
      services: [{ name: "Backend Development", types: ["Nodejs (ExpressJs, Nestjs)"] }],
    },
    toolSelection: {
      prefersBullets: false,
      searchTerms: ["nodejs"],
    },
  });

  assert.match(prompt, /Use I, me, and my/);
  assert.match(prompt, /Use only the facts that appear in the provided portfolio data/i);
  assert.match(prompt, /Sound like I am answering a real visitor/i);
});
