require("dotenv").config();

const express = require("express");
const { initContext } = require("./core/context");

const app = express();

// Security middleware
app.set("trust proxy", 1); // Trust first proxy for IP detection
app.use(express.json({ limit: "10mb" })); // Limit request size

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

initContext();

// Routes
app.use("/chat", require("./routes/chat"));

app.get("/", (_, res) =>
  res.json({
    status: "Portfolio AI running",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  }),
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: ["/chat"],
    method: req.method,
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    timestamp: new Date().toISOString(),
  });
});

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
