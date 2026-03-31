const { PORTFOLIO_KEYWORDS, MALICIOUS_PATTERNS } = require("./constants");

/**
 * Security Validator for Portfolio Chatbot
 * Basic validation without enterprise-level complexity
 */
class SecurityValidator {
  constructor() {
    // Simple rate limiting (portfolio sites have low traffic)
    this.rateLimits = new Map();
    this.maxRequestsPerMinute = 10;
  }

  /**
   * Simple input validation - just check basic security
   */
  validateInput(input) {
    if (!input || typeof input !== "string") {
      return { isValid: false, issues: ["Invalid input format"] };
    }

    if (input.length > 500) {
      return { isValid: false, issues: ["Input too long"] };
    }

    // Check for basic malicious patterns
    const isMalicious = MALICIOUS_PATTERNS.some((pattern) =>
      pattern.test(input),
    );
    if (isMalicious) {
      return { isValid: false, issues: ["Potentially malicious input"] };
    }

    return { isValid: true };
  }

  /**
   * Simple portfolio intent validation
   */
  validateIntent(question) {
    const lowerQuestion = question.toLowerCase();

    // Check if question has portfolio-related keywords
    const hasPortfolioIntent = PORTFOLIO_KEYWORDS.some((keyword) =>
      lowerQuestion.includes(keyword),
    );

    return {
      isPortfolioRelated: hasPortfolioIntent,
      isOffTopic: !hasPortfolioIntent,
    };
  }

  /**
   * Simple rate limiting
   */
  checkRateLimit(userIdentifier) {
    const now = Date.now();
    const userKey = userIdentifier || "anonymous";

    if (!this.rateLimits.has(userKey)) {
      this.rateLimits.set(userKey, { count: 1, resetTime: now + 60000 });
      return true;
    }

    const userLimit = this.rateLimits.get(userKey);

    // Reset if minute passed
    if (now > userLimit.resetTime) {
      this.rateLimits.set(userKey, { count: 1, resetTime: now + 60000 });
      return true;
    }

    // Check if within limit
    if (userLimit.count >= this.maxRequestsPerMinute) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  /**
   * Simple logging (just console for portfolio chatbot)
   */
  logSecurityEvent(event, input, details) {
    console.log(`[SECURITY] ${event}: ${input.substring(0, 50)}`, details);
  }
}

module.exports = { SecurityValidator };
