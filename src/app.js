const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const { initContext } = require("./core/context");

const app = express();
const isDevelopment = process.env.NODE_ENV !== "production";

// No app-level compression: Cloudflare's edge already compresses Worker
// responses, and double-compressing (gzip here + brotli at the edge)
// corrupts the body since the edge doesn't decompress before re-encoding.

// Basic rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Enable CORS for allowed origin from .env (strict enforcement).
// No wildcard default: CORS_ORIGIN must be explicitly set to "*" to open
// this up, otherwise only origins it lists (plus localhost in dev) pass.
const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

class CorsRejectionError extends Error {
  constructor(message) {
    super(message);
    this.status = 403;
  }
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Reject requests with no origin (like curl, Postman, or server-to-server)
      if (!origin) {
        return callback(
          new CorsRejectionError(
            "Requests without an Origin header are not allowed",
          ),
        );
      }

      const isLocalOrigin =
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
      const isAllowed =
        corsOrigins.includes("*") ||
        corsOrigins.includes(origin) ||
        (isDevelopment && isLocalOrigin);

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new CorsRejectionError("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// Security middleware
app.set("trust proxy", 1); // Trust first proxy for IP detection
app.use(express.json({ limit: "10mb" })); // Limit request size
app.use(helmet()); // Use helmet for security headers

initContext();

// Routes
app.use("/chat", require("./routes/chat"));
app.use("/api", require("./routes/data"));

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
    availableEndpoints: [
      "/chat",
      "/api/contact",
      "/api/skills",
      "/api/experience",
      "/api/education",
      "/api/projects",
      "/api/services",
      "/api/stats",
      "/api/additional",
      "/api/all",
    ],
    method: req.method,
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  if (err instanceof CorsRejectionError) {
    return res.status(err.status).json({
      error: err.message,
      code: "CORS_REJECTED",
      timestamp: new Date().toISOString(),
    });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;
