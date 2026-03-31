const { GoogleGenAI } = require("@google/genai");

/**
 * Tool Selector
 * Handles intelligent tool selection using AI and fallback logic
 */
class ToolSelector {
  constructor(apiKey) {
    this.ai = new GoogleGenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Use AI to intelligently determine which tools are relevant
   */
  async getRelevantTools(question) {
    const toolSelectionPrompt = `
Analyze this user question and determine which portfolio tools are needed to answer it properly.

AVAILABLE TOOLS:
1. contact - Phone, email, website, address information
2. skills - Technical and soft skills (can specify "hard", "soft", or "all")  
3. experience - Work history and career information
4. education - Educational background and degrees
5. projects - Portfolio projects and development work
6. services - Services offered and capabilities
7. stats - Years of experience and statistics
8. search - Search for specific technologies/terms in portfolio

USER QUESTION: "${question}"

Response format (JSON only):
{
  "tools": ["tool1", "tool2"],
  "skillType": "all",
  "searchTerm": "optional search term"
}

Only include tools that are actually needed to answer the question. For skills, specify "hard", "soft", or "all". Include searchTerm only if searching for specific technology.`;

    try {
      const result = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: toolSelectionPrompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 200 },
      });

      const response = result.candidates[0].content.parts[0].text.trim();
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error("Tool selection error:", error);
    }

    // Fallback to basic keyword matching if AI selection fails
    return this.fallbackToolSelection(question);
  }

  /**
   * Fallback tool selection using basic keywords
   */
  fallbackToolSelection(question) {
    const lowerQuestion = question.toLowerCase();
    const tools = [];
    let skillType = "all";
    let searchTerm = null;

    if (lowerQuestion.match(/\b(email|phone|contact|reach|website)\b/))
      tools.push("contact");
    if (
      lowerQuestion.match(
        /\b(skills|technologies|tech stack|programming|frameworks|frontend|front-end|libraries|tools|stack|languages)\b/,
      )
    ) {
      tools.push("skills");
      if (lowerQuestion.includes("soft")) skillType = "soft";
      else if (lowerQuestion.match(/\b(technical|hard)\b/)) skillType = "hard";
    }
    if (
      lowerQuestion.match(
        /\b(experience|work|job|career|role|position|current|employment|title)\b/,
      )
    )
      tools.push("experience");
    if (
      lowerQuestion.match(
        /\b(education|educational|degree|university|college|school|background)\b/,
      )
    )
      tools.push("education");
    if (lowerQuestion.match(/\b(projects|portfolio|built|developed)\b/))
      tools.push("projects");
    if (
      lowerQuestion.match(
        /\b(services|capabilities|offer|consulting|freelance|hire|rate|hourly|pricing|cost|remote|maintenance|available)\b/,
      )
    )
      tools.push("services");
    if (lowerQuestion.match(/\b(years|statistics|how many|how much)\b/))
      tools.push("stats");

    // Additional info for certifications, industries, cloud, APIs, development tools
    if (
      lowerQuestion.match(
        /\b(certifications|certified|industries|industry|cloud|aws|azure|gcp|apis|api|development\s+tools)\b/,
      )
    )
      tools.push("additional");

    const searchMatch = lowerQuestion.match(
      /(?:know|use|familiar with|work with|experience with)\s+([a-zA-Z0-9.+-]+)/,
    );
    if (searchMatch) {
      tools.push("search");
      searchTerm = searchMatch[1].trim();
    }

    return { tools, skillType, searchTerm };
  }

  /**
   * Get relevant data based on tool selection
   */
  async getRelevantData(question, portfolioTools) {
    // Use fast regex-based tool selection instead of AI call for better performance
    const toolSelection = this.fallbackToolSelection(question);
    const toolData = {};

    for (const tool of toolSelection.tools || []) {
      switch (tool) {
        case "contact":
          toolData.contact = portfolioTools.getContactInfo();
          break;
        case "skills":
          toolData.skills = portfolioTools.getSkills(
            toolSelection.skillType || "all",
          );
          break;
        case "experience":
          toolData.experience = portfolioTools.getExperience();
          break;
        case "education":
          toolData.education = portfolioTools.getEducation();
          break;
        case "projects":
          toolData.projects = portfolioTools.getProjects();
          break;
        case "services":
          toolData.services = portfolioTools.getServices();
          break;
        case "stats":
          toolData.stats = portfolioTools.getStats();
          break;
        case "additional":
          toolData.additional = portfolioTools.getAdditionalInfo();
          break;
        case "search":
          if (toolSelection.searchTerm) {
            toolData.search = portfolioTools.searchPortfolio(
              toolSelection.searchTerm,
            );
          }
          break;
      }
    }

    return { toolData, toolSelection };
  }
}

module.exports = { ToolSelector };
