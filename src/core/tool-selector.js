/**
 * Tool Selector for Portfolio Chatbot
 * Fast regex-based tool selection without AI calls
 */
const {
  BROAD_QUESTION_PATTERNS,
  TECH_TERM_PATTERNS,
} = require("./constants");

class ToolSelector {
  extractSearchTerms(question) {
    return TECH_TERM_PATTERNS.filter(({ pattern }) => pattern.test(question)).map(
      ({ term }) => term,
    );
  }

  /**
   * Fast tool selection using regex patterns (no AI calls needed)
   */
  getRelevantTools(question) {
    const tools = new Set();
    let skillType = "all";
    const searchTerms = this.extractSearchTerms(question);
    const lowerQuestion = question.toLowerCase();
    const isBroadQuery = BROAD_QUESTION_PATTERNS.some((pattern) =>
      pattern.test(question),
    );
    const prefersBullets =
      isBroadQuery ||
      /\b(bullets?|bullet\s+points?|list|outline|stack|skills|technologies|tools)\b/i.test(
        question,
      );

    // Contact information
    if (
      /\b(email|phone|contact|reach|address|website|location|located|where.*located)\b/i.test(
        question,
      )
    ) {
      tools.add("contact");
    }

    // Skills and technologies
    if (
      searchTerms.length > 0 ||
      /\b(skills|technologies|tech|programming|languages|frameworks|tools|stack|know|familiar|use|strengths|abilities|expertise|worked with|platforms?)\b/i.test(
        question,
      )
    ) {
      tools.add("skills");
      tools.add("services");

      // Determine skill type
      if (/\b(soft|communication|leadership|teamwork)\b/i.test(question)) {
        skillType = "soft";
      } else if (/\b(technical|hard|programming|coding)\b/i.test(question)) {
        skillType = "hard";
      }
    }

    // Experience and work history
    if (
      /\b(experience|work|job|career|role|position|current|employment|years|background|responsibilit(?:y|ies)|focus|specialize|specialise|day to day)\b/i.test(
        question,
      )
    ) {
      tools.add("experience");

      if (/\b(how\s+many|years|statistics|stats|how\s+much)\b/i.test(question)) {
        tools.add("stats");
      }
    }

    // Education
    if (
      /\b(education|degree|university|college|school|studied|graduated|qualification|certification|certifications)\b/i.test(
        question,
      )
    ) {
      tools.add("education");
    }

    // Projects and portfolio
    if (
      /\b(projects|built|developed|created|portfolio|apps|applications|websites|trunow|mercury|aboveo|asa|recent|latest|favorite|favourite|best|challenging|challenge|open source)\b/i.test(
        question,
      )
    ) {
      tools.add("projects");
    }

    // Services offered
    if (
      /\b(services|offer|help|capabilities|rates|pricing|hire|freelance)\b/i.test(
        question,
      )
    ) {
      tools.add("services");
    }

    if (/\b(hire|freelance|available|availability)\b/i.test(question)) {
      tools.add("summary");
      tools.add("contact");
    }

    if (
      /\b(platform|cloud|backend|frontend|full[-\s]?stack|api|devops|release|delivery)\b/i.test(
        question,
      )
    ) {
      tools.add("services");
      tools.add("experience");
    }

    if (/\b(observability|monitoring|logging|analytics)\b/i.test(question)) {
      tools.add("services");
    }

    if (/\b(metrics|statistics|stats)\b/i.test(question)) {
      tools.add("stats");
    }

    if (/\b(team|teamwork|collaboration|collaborate)\b/i.test(question)) {
      tools.add("skills");
      tools.add("summary");
    }

    if (searchTerms.length > 0 && /\b(project|built|build|experience)\b/i.test(question)) {
      tools.add("projects");
    }

    if (
      searchTerms.length > 0 &&
      (lowerQuestion === searchTerms[0] || question.trim().split(/\s+/).length <= 2)
    ) {
      tools.add("services");
      tools.add("projects");
    }

    // General/vague questions - provide comprehensive overview
    if (isBroadQuery) {
      tools.add("summary");
      tools.add("skills");
      tools.add("experience");

      if (
        searchTerms.length === 0 &&
        !/\b(stack|technologies|tools|cloud|platform|backend|frontend|devops|api)\b/i.test(
          question,
        )
      ) {
        tools.add("projects");
        tools.add("education");
      }
    }

    // If no specific tools identified, get basic info
    if (tools.size === 0) {
      tools.add("summary");
      tools.add("skills");
      tools.add("experience");
    }

    return {
      tools: [...tools],
      skillType,
      searchTerms,
      isBroadQuery,
      prefersBullets,
    };
  }
}

module.exports = { ToolSelector };
