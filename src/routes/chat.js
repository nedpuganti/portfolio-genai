const express = require("express");
const router = express.Router();
const { askAI, enhancedAI } = require("../core/ai");

// Middleware to extract user identifier for rate limiting
function getUserIdentifier(req) {
  // Use IP address as basic identifier (can be enhanced with sessions/auth)
  return req.ip || req.connection.remoteAddress || "unknown";
}

// Main chat endpoint with smart conversation management
router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required",
        code: "MISSING_PROMPT",
      });
    }

    // Basic input sanitization
    if (typeof prompt !== "string") {
      return res.status(400).json({
        error: "Prompt must be a string",
        code: "INVALID_PROMPT_TYPE",
      });
    }

    const userIdentifier = getUserIdentifier(req);
    const answer = await askAI(prompt, userIdentifier);

    res.json({ answer });
  } catch (err) {
    console.error("Chat route error:", err);

    // Don't expose internal error details
    res.status(500).json({
      error: "Service temporarily unavailable. Please try again later.",
      code: "INTERNAL_ERROR",
    });
  }
});

module.exports = router;
