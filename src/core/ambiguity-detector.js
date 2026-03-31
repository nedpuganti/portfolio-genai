/**
 * Ambiguity Detector
 * Detects and handles ambiguous questions and responses
 */
class AmbiguityDetector {
  /**
   * Check for ambiguity in user questions
   */
  checkAmbiguity(question) {
    const issues = [];
    const lowerQuestion = question.toLowerCase().trim();

    // Ambiguous pronouns without clear context
    const ambiguousPronouns = [
      "it",
      "this",
      "that",
      "these",
      "those",
      "he",
      "she",
      "they",
    ];
    const pronounMatches = ambiguousPronouns.filter((pronoun) =>
      new RegExp(`\\b${pronoun}\\b`, "i").test(lowerQuestion),
    );
    if (pronounMatches.length > 0) {
      issues.push({
        type: "ambiguous_pronouns",
        details: `Unclear references: ${pronounMatches.join(", ")}`,
        severity: "medium",
      });
    }

    // Vague quantifiers
    const vagueQuantifiers = [
      "some",
      "many",
      "few",
      "several",
      "most",
      "a lot",
      "much",
      "little",
    ];
    const quantifierMatches = vagueQuantifiers.filter((quant) =>
      lowerQuestion.includes(quant),
    );
    if (quantifierMatches.length > 0) {
      issues.push({
        type: "vague_quantifiers",
        details: `Vague amounts: ${quantifierMatches.join(", ")}`,
        severity: "low",
      });
    }

    // Multiple unrelated topics in one question
    const topicKeywords = {
      skills: ["skills", "technologies", "programming", "languages"],
      experience: ["experience", "work", "job", "career", "years"],
      education: ["education", "degree", "university", "college", "school"],
      projects: ["projects", "built", "developed", "created"],
      contact: ["contact", "email", "phone", "reach"],
    };

    const detectedTopics = [];
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((keyword) => lowerQuestion.includes(keyword))) {
        detectedTopics.push(topic);
      }
    }

    if (detectedTopics.length > 2) {
      issues.push({
        type: "multiple_topics",
        details: `Multiple topics detected: ${detectedTopics.join(", ")}`,
        severity: "medium",
      });
    }

    // Questions too short to be clear
    const words = lowerQuestion.split(/\s+/).filter((word) => word.length > 0);
    if (words.length <= 2) {
      issues.push({
        type: "too_brief",
        details: "Question may be too brief to understand intent",
        severity: "high",
      });
    }

    // Conflicting intentions
    const conflictingPairs = [
      { positive: ["can", "do", "know"], negative: ["cannot", "dont", "not"] },
      { positive: ["yes"], negative: ["no"] },
      { positive: ["have"], negative: ["dont have", "no"] },
    ];

    for (const pair of conflictingPairs) {
      const hasPositive = pair.positive.some((word) =>
        lowerQuestion.includes(word),
      );
      const hasNegative = pair.negative.some((word) =>
        lowerQuestion.includes(word),
      );

      if (hasPositive && hasNegative) {
        issues.push({
          type: "conflicting_intentions",
          details: "Question contains contradictory elements",
          severity: "high",
        });
        break;
      }
    }

    // Extremely open-ended questions
    const openEndedStarters = [
      "tell me about",
      "what about",
      "how about",
      "anything about",
      "everything about",
    ];
    if (openEndedStarters.some((starter) => lowerQuestion.includes(starter))) {
      issues.push({
        type: "too_open_ended",
        details: "Question is very broad and may need clarification",
        severity: "medium",
      });
    }

    return {
      hasAmbiguity: issues.length > 0,
      issues: issues,
      severity: this.getMaxSeverity(issues),
      needsClarification: issues.some((issue) => issue.severity === "high"),
    };
  }

  /**
   * Get maximum severity from ambiguity issues
   */
  getMaxSeverity(issues) {
    if (issues.some((issue) => issue.severity === "high")) return "high";
    if (issues.some((issue) => issue.severity === "medium")) return "medium";
    return "low";
  }

  /**
   * Generate clarification request for ambiguous questions
   */
  generateClarificationRequest(question, ambiguityCheck) {
    const highSeverityIssues = ambiguityCheck.issues.filter(
      (issue) => issue.severity === "high",
    );

    if (highSeverityIssues.length > 0) {
      const issue = highSeverityIssues[0];

      if (issue.type === "too_brief") {
        return "Your question seems quite brief. Could you provide more details about what specific information you're looking for regarding skills, experience, projects, education, services, or contact information?";
      }

      if (issue.type === "conflicting_intentions") {
        return "I'm getting mixed signals from your question. Could you clarify exactly what you're asking about?";
      }
    }

    const mediumIssues = ambiguityCheck.issues.filter(
      (issue) => issue.severity === "medium",
    );
    if (mediumIssues.length > 0) {
      const issue = mediumIssues[0];

      if (issue.type === "ambiguous_pronouns") {
        return "I notice your question uses pronouns like 'it' or 'this'. Could you be more specific about what you're referring to?";
      }

      if (issue.type === "multiple_topics") {
        return "Your question covers multiple topics. Would you like me to focus on one specific area, or would you prefer a general overview?";
      }

      if (issue.type === "too_open_ended") {
        return "That's quite a broad question! Could you narrow it down to specific aspects you're most interested in?";
      }
    }

    return "I want to give you the most accurate answer. Could you provide a bit more detail about what specific information you're looking for?";
  }

  /**
   * Check response for ambiguity and unclear statements
   */
  checkResponseAmbiguity(response, question) {
    const issues = [];

    // Responses with too many hedge words
    const hedgeWords = [
      "might",
      "could",
      "possibly",
      "perhaps",
      "maybe",
      "probably",
      "seems",
      "appears",
    ];
    const hedgeCount = hedgeWords.filter((word) =>
      response.toLowerCase().includes(word),
    ).length;

    if (hedgeCount > 3) {
      issues.push({
        type: "excessive_hedging",
        details: "Response contains many uncertain qualifiers",
        severity: "medium",
      });
    }

    // Contradictory statements within response
    const contradictoryPairs = [
      ["yes", "no"],
      ["can", "cannot"],
      ["has", "does not have"],
      ["knows", "does not know"],
      ["available", "not available"],
    ];

    for (const [positive, negative] of contradictoryPairs) {
      const responseText = response.toLowerCase();
      // Use word boundaries to match whole words only
      const hasPositive = new RegExp(
        `\\b${positive.replace(/\s+/g, "\\s+")}\\b`,
      ).test(responseText);
      const hasNegative = new RegExp(
        `\\b${negative.replace(/\s+/g, "\\s+")}\\b`,
      ).test(responseText);

      if (hasPositive && hasNegative) {
        issues.push({
          type: "internal_contradiction",
          details: `Response contains both "${positive}" and "${negative}"`,
          severity: "high",
        });
      }
    }

    // Responses that are too generic
    const genericPhrases = [
      "in general",
      "typically",
      "usually",
      "most of the time",
      "generally speaking",
    ];
    const genericCount = genericPhrases.filter((phrase) =>
      response.toLowerCase().includes(phrase),
    ).length;

    if (genericCount > 1) {
      issues.push({
        type: "too_generic",
        details:
          "Response contains generic language instead of specific information",
        severity: "medium",
      });
    }

    return {
      hasAmbiguity: issues.length > 0,
      issues: issues,
      severity: this.getMaxSeverity(issues),
      requiresRevision: issues.some((issue) => issue.severity === "high"),
    };
  }
}

module.exports = { AmbiguityDetector };
