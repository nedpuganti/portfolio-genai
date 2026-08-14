require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Secure Portfolio AI running on http://localhost:${PORT}`);
  console.log(
    `📊 Security features: Input validation, Intent checking, Anti-hallucination, Rate limiting, Ambiguity detection`,
  );
  console.log(
    `🎯 Quality controls: Confidence scoring, Response validation, Clarity checking`,
  );
  console.log(
    `💬 Conversation mgmt: Smart categorization, History optimization, Repeated question detection`,
  );
  console.log(`🔗 Endpoints: /chat (POST)`);
  console.log(
    `⚡ Features: 50 msg limit, 30min timeout, auto-cleanup, topic tracking`,
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully");
  process.exit(0);
});
