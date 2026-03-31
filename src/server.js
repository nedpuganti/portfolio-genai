require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const { initContext } = require("./core/context");

const app = express();

// Enable gzip compression for all responses
app.use(compression());

// Basic rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Enable CORS for allowed origin from .env
const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: corsOrigin }));

// Security middleware
app.set("trust proxy", 1); // Trust first proxy for IP detection
app.use(express.json({ limit: "10mb" })); // Limit request size
app.use(helmet()); // Use helmet for security headers

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
