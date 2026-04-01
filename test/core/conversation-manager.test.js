const test = require("node:test");
const assert = require("node:assert/strict");

const { ConversationManager } = require("../../src/core/conversation-manager");

test("conversation manager stores response summaries for repeat handling", () => {
  const manager = new ConversationManager();

  manager.addMessageToConversation(
    "user-1",
    "Can you tell me about your backend stack?",
    "I work with Node.js, Express.js, Nest.js, PostgreSQL, Redis, and Kafka.",
  );

  const repeated = manager.checkForRepeatedQuestion(
    "user-1",
    "Tell me about your backend stack",
  );

  assert.equal(repeated.isRepeated, true);
  assert.match(repeated.previousResponseSummary, /Node\.js/i);
});

test("conversation context includes recent summaries and follow-up guidance", () => {
  const manager = new ConversationManager();

  manager.addMessageToConversation(
    "user-2",
    "What kind of cloud work do you do?",
    "I work across AWS and GCP, including messaging, storage, and delivery workflows.",
  );

  const context = manager.generateConversationContext(
    "user-2",
    "Tell me more about that",
  );

  assert.match(context, /Recent exchanges:/);
  assert.match(context, /Most recent answer summary:/);
});
