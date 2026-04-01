const test = require("node:test");
const assert = require("node:assert/strict");

const { SecurityValidator } = require("../../src/core/security-validator");

test("intent validation allows natural portfolio questions without exact keywords", () => {
  const validator = new SecurityValidator();

  const result = validator.validateIntent(
    "What do you do day to day on platform teams?",
  );

  assert.equal(result.isPortfolioRelated, true);
  assert.equal(result.isOffTopic, false);
});

test("intent validation blocks clearly off-topic questions", () => {
  const validator = new SecurityValidator();

  const result = validator.validateIntent("What's the weather in Atlanta today?");

  assert.equal(result.isOffTopic, true);
});

test("intent validation matches portfolio keyword regex patterns", () => {
  const validator = new SecurityValidator();

  const result = validator.validateIntent(
    "Are you a full-stack engineer with machine-learning experience?",
  );

  assert.equal(result.isPortfolioRelated, true);
  assert.equal(result.isOffTopic, false);
});
