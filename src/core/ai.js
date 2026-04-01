const { getContext } = require("./context");
const { PortfolioTools } = require("./tools");
const { ConversationManager } = require("./conversation-manager");
const { SecurityValidator } = require("./security-validator");
const { ConfidenceAssessor } = require("./confidence-assessor");
const { ToolSelector } = require("./tool-selector");
const { TOOL_CONTEXT_FILES } = require("./constants");
const { buildPrompt } = require("./prompts");
const { extractTextFromModelResult } = require("./response-utils");

let GoogleGenAI = null;
try {
  ({ GoogleGenAI } = require("@google/genai"));
} catch (error) {
  GoogleGenAI = null;
}

const ai =
  GoogleGenAI && process.env.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      })
    : null;

const portfolioTools = new PortfolioTools();

/**
 * Portfolio AI
 * Streamlined processing with minimal overhead
 */
class PortfolioAI {
  constructor(options = {}) {
    this.ai = options.aiClient || ai;
    // Initialize components
    this.conversationManager = new ConversationManager();
    this.securityValidator = new SecurityValidator();
    this.confidenceAssessor = new ConfidenceAssessor();
    this.toolSelector = new ToolSelector();
  }

  getRelevantToolData(toolSelection, question = "") {
    const toolData = {};
    const searchOptions = { searchTerms: toolSelection.searchTerms };

    for (const tool of toolSelection.tools) {
      switch (tool) {
        case "summary":
          toolData.summary = portfolioTools.getSummary();
          break;
        case "contact":
          toolData.contact = portfolioTools.getContactInfo();
          break;
        case "skills":
          toolData.skills = portfolioTools.getSkills(
            toolSelection.skillType,
            searchOptions,
          );
          break;
        case "experience":
          toolData.experience = portfolioTools.getExperience(searchOptions);
          break;
        case "education":
          toolData.education = portfolioTools.getEducation(searchOptions);
          toolData.educationHighlights = portfolioTools.getEducationHighlights();
          break;
        case "projects":
          toolData.projects = portfolioTools.getProjects(searchOptions);
          toolData.projectHighlights = portfolioTools.getProjectHighlights();
          break;
        case "services":
          toolData.services = portfolioTools.getServices(searchOptions);
          break;
        case "stats":
          toolData.stats = portfolioTools.getStats();
          break;
      }
    }

    if (/\b(hire|freelance|available|availability|contact)\b/i.test(question)) {
      toolData.summary = toolData.summary || portfolioTools.getSummary();
      toolData.contact = toolData.contact || portfolioTools.getContactInfo();
    }

    return toolData;
  }

  getSupplementalContext(toolSelection, toolData) {
    const hasRelevantData = Object.keys(toolData).length > 0;

    if (!hasRelevantData) {
      return getContext();
    }

    if (!toolSelection.isBroadQuery) {
      return "";
    }

    const contextFiles = [...new Set(
      toolSelection.tools.flatMap((tool) => TOOL_CONTEXT_FILES[tool] || []),
    )];

    return getContext({ files: contextFiles });
  }

  /**
   * Simplified processing pipeline (3 steps instead of 7)
   */
  async ask(question, userIdentifier = "anonymous") {
    try {
      // STEP 1: Basic Security & Rate Limiting
      if (!this.securityValidator.checkRateLimit(userIdentifier)) {
        return "Too many requests. Please wait a moment before trying again.";
      }

      const inputValidation = this.securityValidator.validateInput(question);
      if (!inputValidation.isValid) {
        return "I can't process this request. Please rephrase your question.";
      }

      const intentValidation = this.securityValidator.validateIntent(question);
      if (intentValidation.isOffTopic) {
        return "I can help with questions about skills, experience, projects, education, services, and contact information.";
      }

      // STEP 2: Check for Repeated Questions & Get Data
      const repeatedCheck = this.conversationManager.checkForRepeatedQuestion(
        userIdentifier,
        question,
      );

      // Fast tool selection (no AI calls)
      const toolSelection = this.toolSelector.getRelevantTools(question);
      const toolData = this.getRelevantToolData(toolSelection, question);

      // STEP 3: Generate Response
      const confidence = this.confidenceAssessor.assessConfidence(
        question,
        toolData,
        toolSelection,
      );
      if (!confidence.canAnswer) {
        return "I'm not confident I can provide accurate information about that. Please ask about my skills, experience, projects, education, or contact info.";
      }

      if (!this.ai) {
        return "I'm currently unavailable because the AI service is not configured correctly.";
      }

      const supplementalContext = this.getSupplementalContext(
        toolSelection,
        toolData,
      );
      const conversationContext =
        this.conversationManager.generateConversationContext(
          userIdentifier,
          question,
        );

      // Generate AI response
      const securePrompt = buildPrompt({
        question,
        relevantData: toolData,
        supplementalContext,
        conversationContext,
        toolSelection,
        repeatedQuestion: repeatedCheck,
      });

      const result = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: securePrompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1000,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      });

      const response =
        extractTextFromModelResult(result) ||
        "I couldn't generate a reliable response just now. Please try rephrasing your question.";

      // Add to conversation history
      this.conversationManager.addMessageToConversation(
        userIdentifier,
        question,
        response,
      );

      return response;
    } catch (error) {
      console.error("Portfolio AI Error:", error);
      return "I'm having trouble right now. Please try again in a moment.";
    }
  }
}

module.exports = { PortfolioAI };
