/**
 * Security Validator
 * Handles input/output validation, security checks, and rate limiting
 */
class SecurityValidator {
  constructor() {
    // Security and validation patterns
    this.maliciousPatterns = [
      /ignore\s+previous\s+instructions/i,
      /system\s+prompt/i,
      /you\s+are\s+now/i,
      /forget\s+everything/i,
      /jailbreak/i,
      /pretend\s+to\s+be/i,
      /<script>/i,
      /sql\s+injection/i,
      /xss/i,
      /hack/i,
    ];

    this.sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\b/g, // Credit card
      /password/gi,
      /secret/gi,
      /private\s+key/gi,
      /api\s+key/gi,
    ];

    this.portfolioIntentKeywords = [
      "skills",
      "experience",
      "projects",
      "education",
      "contact",
      "services",
      "work",
      "career",
      "portfolio",
      "technologies",
      "programming",
      "developer",
      "background",
      "qualifications",
      "know",
      "familiar",
      "built",
      "developed",
      "email",
      "phone",
      "address",
      "reach",
      "hire",
      "available",
      "role",
      "position",
      "current",
      "title",
      "employment",
      "frameworks",
      "frontend",
      "front-end",
      "libraries",
      "tools",
      "stack",
      "languages",
      "cloud",
      "aws",
      "azure",
      "gcp",
      "freelance",
      "rate",
      "hourly",
      "pricing",
      "cost",
      "certifications",
      "industry",
      "industries",
      "testing",
      "frameworks",
      "remote",
      "remotely",
      "consulting",
      "maintenance",
    ];

    // Rate limiting storage
    this.rateLimits = new Map();
  }

  /**
   * Input validation and security checks
   */
  validateInput(question) {
    const issues = [];

    // Check length
    if (!question || question.trim().length === 0) {
      issues.push("Empty question");
    }
    if (question.length > 1000) {
      issues.push("Question too long");
    }

    // Check for malicious patterns
    for (const pattern of this.maliciousPatterns) {
      if (pattern.test(question)) {
        issues.push("Potential security risk detected");
        break;
      }
    }

    // Check for non-printable characters
    if (/[\x00-\x1F\x7F-\x9F]/.test(question)) {
      issues.push("Invalid characters detected");
    }

    return {
      isValid: issues.length === 0,
      issues: issues,
    };
  }

  /**
   * Intent validation - ensure question is portfolio-related
   */
  validateIntent(question) {
    const lowerQuestion = question.toLowerCase();

    // Check if question contains portfolio-related keywords
    const hasPortfolioIntent = this.portfolioIntentKeywords.some((keyword) =>
      lowerQuestion.includes(keyword),
    );

    // Check for off-topic patterns
    const offTopicPatterns = [
      /weather/i,
      /news/i,
      /politics/i,
      /sports/i,
      /cooking/i,
      /recipes/i,
      /medical/i,
      /health/i,
      /legal/i,
      /financial\s+advice/i,
      /investment/i,
      /gambling/i,
      /cryptocurrency/i,
      /dating/i,
      /relationship/i,
    ];

    const isOffTopic = offTopicPatterns.some((pattern) =>
      pattern.test(question),
    );

    // Generic questions that might be portfolio-related
    const genericQuestions = [
      /who\s+are\s+you/i,
      /tell\s+me\s+about/i,
      /what\s+do\s+you/i,
      /how\s+do\s+you/i,
      /can\s+you/i,
      /do\s+you/i,
      /what'?s\s+your/i,
      /how\s+can\s+I\s+(contact|reach)/i,
      /get\s+in\s+touch/i,
    ];

    const isGeneric = genericQuestions.some((pattern) =>
      pattern.test(question),
    );

    return {
      isPortfolioRelated: hasPortfolioIntent || (isGeneric && !isOffTopic),
      isOffTopic: isOffTopic,
    };
  }

  /**
   * Redact sensitive information from responses
   */
  redactSensitiveInfo(text) {
    let redacted = text;

    // Redact sensitive patterns
    for (const pattern of this.sensitivePatterns) {
      redacted = redacted.replace(pattern, "[REDACTED]");
    }

    return redacted;
  }

  /**
   * Anti-hallucination response validation
   */
  validateResponse(response, toolData) {
    const issues = [];

    // Check for hallucination indicators
    const hallucinationPatterns = [
      /according\s+to\s+my\s+knowledge/i,
      /based\s+on\s+general\s+information/i,
      /typically/i,
      /usually/i,
      /in\s+most\s+cases/i,
    ];

    for (const pattern of hallucinationPatterns) {
      if (pattern.test(response)) {
        issues.push("Potential hallucination detected");
        break;
      }
    }

    // Check if response mentions data not provided
    if (
      Object.keys(toolData).length === 0 &&
      response.includes("according to")
    ) {
      issues.push("Response claims data without tool data provided");
    }

    // Check response length (too short might indicate error)
    if (response.trim().length < 10) {
      issues.push("Response too short");
    }

    return {
      isValid: issues.length === 0,
      issues: issues,
    };
  }

  /**
   * Apply guardrails and safety checks with confidence adjustments
   */
  applyGuardrails(question, response, confidence = null) {
    const guardrails = {
      maxResponseLength: confidence?.level === "very_high" ? 3000 : 2000,
      requireDataBacking: true,
      preventOffTopic: true,
    };

    let safedResponse = response;

    // Truncate if too long
    if (safedResponse.length > guardrails.maxResponseLength) {
      safedResponse =
        safedResponse.substring(0, guardrails.maxResponseLength) + "...";
    }

    // Add confidence-based disclaimers
    if (confidence) {
      if (confidence.level === "low") {
        if (
          !safedResponse.includes("I don't have") &&
          !safedResponse.includes("not available")
        ) {
          safedResponse +=
            "\n\n⚠️ *This response has lower confidence. Please verify details directly if important.*";
        }
      } else if (confidence.level === "medium") {
        if (
          safedResponse.includes("I'm not sure") ||
          safedResponse.includes("I don't have")
        ) {
          safedResponse +=
            "\n\n*Please contact directly for more detailed information.*";
        }
      }
    }

    // Add disclaimer for uncertain responses
    if (
      safedResponse.includes("I'm not sure") ||
      safedResponse.includes("I don't have")
    ) {
      if (!safedResponse.includes("contact directly")) {
        safedResponse +=
          "\n\nPlease contact directly for more detailed information.";
      }
    }

    return safedResponse;
  }

  /**
   * Security event logging
   */
  logSecurityEvent(event, question, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      question: question?.substring(0, 100) + "...", // Truncate for logging
      details,
      ip: "unknown", // Could be enhanced to capture IP from request
    };

    console.warn(`[SECURITY] ${timestamp}: ${event}`, logEntry);

    // In production, you might want to send this to a security monitoring system
    // securityMonitor.alert(logEntry);
  }

  /**
   * Rate limiting check (basic implementation)
   */
  checkRateLimit(identifier = "default") {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 30; // Max 30 requests per minute

    const userLimits = this.rateLimits.get(identifier) || {
      count: 0,
      resetTime: now + windowMs,
    };

    if (now > userLimits.resetTime) {
      userLimits.count = 1;
      userLimits.resetTime = now + windowMs;
    } else {
      userLimits.count++;
    }

    this.rateLimits.set(identifier, userLimits);

    if (userLimits.count > maxRequests) {
      this.logSecurityEvent("RATE_LIMIT_EXCEEDED", null, {
        identifier,
        count: userLimits.count,
        limit: maxRequests,
      });
      return false;
    }

    return true;
  }
}

module.exports = { SecurityValidator };
