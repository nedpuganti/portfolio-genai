const { PORTFOLIO_KEYWORDS } = require("./constants");

/**
 * Confidence Assessor for Portfolio Chatbot
 * Basic confidence checking without complex scoring
 */
class ConfidenceAssessor {
  /**
   * Simple confidence assessment - just check if we can likely answer
   */
  assessConfidence(question, toolData, toolSelection = {}) {
    // Check if question matches portfolio topics
    const hasPortfolioKeywords = PORTFOLIO_KEYWORDS.some((pattern) =>
      pattern.test(question),
    );

    // Check if we have relevant data
    const hasRelevantData = Object.keys(toolData).length > 0;
    const hasRelevantTools =
      Array.isArray(toolSelection.tools) && toolSelection.tools.length > 0;

    // Simple confidence logic
    if (hasRelevantData) {
      return { confidence: "high", canAnswer: true };
    } else if (hasPortfolioKeywords || hasRelevantTools) {
      return { confidence: "medium", canAnswer: true };
    } else {
      return { confidence: "low", canAnswer: false };
    }
  }
}

module.exports = { ConfidenceAssessor };
