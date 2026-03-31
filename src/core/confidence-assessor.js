const { PORTFOLIO_KEYWORDS } = require("./constants");

/**
 * Confidence Assessor for Portfolio Chatbot
 * Basic confidence checking without complex scoring
 */
class ConfidenceAssessor {
  /**
   * Simple confidence assessment - just check if we can likely answer
   */
  assessConfidence(question, toolData) {
    const lowerQuestion = question.toLowerCase();

    // Check if question matches portfolio topics
    const hasPortfolioKeywords = PORTFOLIO_KEYWORDS.some((keyword) =>
      lowerQuestion.includes(keyword),
    );

    // Check if we have relevant data
    const hasRelevantData = Object.keys(toolData).length > 0;

    // Simple confidence logic
    if (hasPortfolioKeywords && hasRelevantData) {
      return { confidence: "high", canAnswer: true };
    } else if (hasPortfolioKeywords) {
      return { confidence: "medium", canAnswer: true };
    } else {
      return { confidence: "low", canAnswer: false };
    }
  }
}

module.exports = { ConfidenceAssessor };
