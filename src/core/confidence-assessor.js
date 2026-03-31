/**
 * Confidence Assessor
 * Evaluates confidence in AI responses based on data availability and question coverage
 */
class ConfidenceAssessor {
  constructor() {
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
    ];
  }

  /**
   * Assess confidence in our ability to answer the question
   */
  assessConfidence(question, toolData, toolSelection) {
    let confidenceScore = 0;
    const confidenceFactors = {
      dataAvailability: 0,
      toolSelectionReliability: 0,
      questionCoverage: 0,
      dataQuality: 0,
    };

    // 1. Data Availability Confidence (0-40 points)
    const availableDataTypes = Object.keys(toolData).length;
    const requestedDataTypes = toolSelection?.tools?.length || 0;

    if (requestedDataTypes > 0) {
      confidenceFactors.dataAvailability = Math.min(
        40,
        (availableDataTypes / requestedDataTypes) * 40,
      );
    } else if (availableDataTypes > 0) {
      confidenceFactors.dataAvailability = 30; // Some data available for general questions
    }

    // 2. Tool Selection Reliability (0-25 points)
    const lowerQuestion = question.toLowerCase();
    const directMatches = this.portfolioIntentKeywords.filter((keyword) =>
      lowerQuestion.includes(keyword),
    ).length;

    confidenceFactors.toolSelectionReliability = Math.min(
      25,
      directMatches * 8,
    );

    // 3. Question Coverage (0-20 points)
    const questionWords = question
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);
    const contextString = JSON.stringify(toolData).toLowerCase();
    const matchingWords = questionWords.filter((word) =>
      contextString.includes(word),
    ).length;

    if (questionWords.length > 0) {
      confidenceFactors.questionCoverage = Math.min(
        20,
        (matchingWords / questionWords.length) * 20,
      );
    }

    // 4. Data Quality Assessment (0-15 points)
    let dataQualityScore = 0;
    for (const [key, data] of Object.entries(toolData)) {
      if (data && typeof data === "object" && !data.error) {
        if (Array.isArray(data) && data.length > 0) dataQualityScore += 3;
        else if (Object.keys(data).length > 0) dataQualityScore += 3;
      }
    }
    confidenceFactors.dataQuality = Math.min(15, dataQualityScore);

    // Calculate total confidence
    confidenceScore = Object.values(confidenceFactors).reduce(
      (a, b) => a + b,
      0,
    );

    return {
      score: Math.round(confidenceScore),
      factors: confidenceFactors,
      level: this.getConfidenceLevel(confidenceScore),
      shouldProceed: confidenceScore >= 25, // Reduced threshold for contact/education questions
      hasRelevantData: Object.keys(toolData).length > 0,
    };
  }

  /**
   * Get confidence level description
   */
  getConfidenceLevel(score) {
    if (score >= 80) return "very_high";
    if (score >= 65) return "high";
    if (score >= 50) return "medium";
    if (score >= 35) return "low";
    return "very_low";
  }

  /**
   * Generate low confidence response
   */
  generateLowConfidenceResponse(question, confidence) {
    const responses = [
      "I don't have enough specific information to answer that question accurately. Could you ask about skills, experience, projects, education, services, or contact information?",
      "I'm not confident I can provide accurate information for that question. I can help with questions about professional background, skills, work experience, or contact details.",
      "I'd rather not guess at an answer. I'm most reliable when answering questions about technical skills, work experience, projects, education, or how to get in touch.",
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    // Add specific guidance based on what data is available
    if (confidence.hasRelevantData) {
      return (
        randomResponse +
        " Please try rephrasing your question to be more specific."
      );
    }

    return randomResponse;
  }
}

module.exports = { ConfidenceAssessor };
