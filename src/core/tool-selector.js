/**
 * Tool Selector for Portfolio Chatbot
 * Fast regex-based tool selection without AI calls
 */
class ToolSelector {
  /**
   * Fast tool selection using regex patterns (no AI calls needed)
   */
  async getRelevantTools(question) {
    const lowerQuestion = question.toLowerCase();
    const tools = [];
    let skillType = "all";
    let searchTerm = null;

    // Contact information
    if (/\b(email|phone|contact|reach|address|website)\b/i.test(question)) {
      tools.push("contact");
    }

    // Skills and technologies
    if (
      /\b(skills|technologies|tech|programming|languages|frameworks|tools|stack|know|familiar|use)\b/i.test(
        question,
      )
    ) {
      tools.push("skills");

      // Determine skill type
      if (/\b(soft|communication|leadership|teamwork)\b/i.test(question)) {
        skillType = "soft";
      } else if (/\b(technical|hard|programming|coding)\b/i.test(question)) {
        skillType = "hard";
      }

      // Extract search term for specific technologies
      const techPatterns =
        /\b(react|angular|node|javascript|python|java|docker|aws|azure|gcp)\b/i;
      const match = question.match(techPatterns);
      if (match) {
        searchTerm = match[0];
      }
    }

    // Experience and work history
    if (
      /\b(experience|work|job|career|role|position|current|employment|years)\b/i.test(
        question,
      )
    ) {
      tools.push("experience");

      if (/\b(how\s+many|years|statistics|how\s+much)\b/i.test(question)) {
        tools.push("stats");
      }
    }

    // Education
    if (
      /\b(education|degree|university|college|school|studied|graduated)\b/i.test(
        question,
      )
    ) {
      tools.push("education");
    }

    // Projects and portfolio
    if (
      /\b(projects|built|developed|created|portfolio|apps|applications|websites)\b/i.test(
        question,
      )
    ) {
      tools.push("projects");
    }

    // Services offered
    if (
      /\b(services|offer|help|capabilities|rates|pricing|hire|freelance)\b/i.test(
        question,
      )
    ) {
      tools.push("services");
    }

    // If no specific tools identified, get basic info
    if (tools.length === 0) {
      tools.push("skills", "experience");
    }

    return {
      tools: [...new Set(tools)], // Remove duplicates
      skillType,
      searchTerm,
    };
  }
}

module.exports = { ToolSelector };
