const express = require("express");
const router = express.Router();
const { PortfolioAI } = require("../core/ai");

// Initialize AI (single instance)
const portfolioAI = new PortfolioAI();

// Simple user identifier for rate limiting
function getUserIdentifier(req) {
  return req.ip || req.connection.remoteAddress || "anonymous";
}

// Optimized chat endpoint with minimal overhead
router.post("/", async (req, res) => {
  try {
    const { prompt } = req.body;

    // Basic validation
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Valid prompt required",
        code: "INVALID_PROMPT",
      });
    }

    const userIdentifier = getUserIdentifier(req);
    const answer = await portfolioAI.ask(prompt, userIdentifier);

    res.json({ answer });
  } catch (err) {
    console.error("Chat route error:", err);
    res.status(500).json({
      error: "Service temporarily unavailable. Please try again later.",
      code: "INTERNAL_ERROR",
    });
  }
});

module.exports = router;
