const { GoogleGenAI } = require("@google/genai");
const { getContext } = require("./context");
const { PortfolioTools } = require("./tools");
const { ConversationManager } = require("./conversation-manager");
const { SecurityValidator } = require("./security-validator");
const { ConfidenceAssessor } = require("./confidence-assessor");
const { ToolSelector } = require("./tool-selector");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const portfolioTools = new PortfolioTools();

/**
 * Portfolio AI
 * Streamlined processing with minimal overhead
 */
class PortfolioAI {
  constructor() {
    this.baseSystemPrompt = `
You are Naren responding naturally to questions about your professional background.

TONE: Professional yet personable, direct and informative
RULES: 
- Never say "Based on the data" or reference data sources
- Just answer directly from the portfolio information provided
- If you don't know something, say "I don't have that information"
- Don't make stuff up
- Skip casual greetings like "Hey there!" and go straight to answering
- For professional summaries, role overviews, skills, and tech stack questions, prefer short bullet points instead of one large paragraph
- Keep bullets concise and group related technologies together when possible
`;

    // Initialize components
    this.conversationManager = new ConversationManager();
    this.securityValidator = new SecurityValidator();
    this.confidenceAssessor = new ConfidenceAssessor();
    this.toolSelector = new ToolSelector();
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
      if (
        repeatedCheck.isRepeated &&
        repeatedCheck.timeSinceLastAsked < 2 * 60 * 1000
      ) {
        return `I just answered a similar question less than ${Math.round(repeatedCheck.timeSinceLastAsked / 60000)} minute(s) ago. Would you like me to elaborate on a specific aspect?`;
      }

      // Fast tool selection (no AI calls)
      const toolSelection = await this.toolSelector.getRelevantTools(question);
      const toolData = {};

      // Get relevant portfolio data
      for (const tool of toolSelection.tools) {
        switch (tool) {
          case "contact":
            toolData.contact = portfolioTools.getContactInfo();
            break;
          case "skills":
            toolData.skills = portfolioTools.getSkills(toolSelection.skillType);
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
        }
      }

      // STEP 3: Generate Response
      const confidence = this.confidenceAssessor.assessConfidence(
        question,
        toolData,
      );
      if (!confidence.canAnswer) {
        return "I'm not confident I can provide accurate information about that. Please ask about my skills, experience, projects, education, or contact info.";
      }

      // Build enhanced context
      const generalContext = getContext();
      let enhancedContext = "";
      if (Object.keys(toolData).length > 0) {
        enhancedContext = `\n\nRELEVANT PORTFOLIO DATA:\n${JSON.stringify(toolData, null, 2)}\n`;
      }

      const conversationContext =
        this.conversationManager.generateConversationContext(userIdentifier);

      // Generate AI response
      const securePrompt = `${this.baseSystemPrompt}\n\nPORTFOLIO INFO:\n${generalContext}${enhancedContext}${conversationContext}\n\nUSER QUESTION: ${question}\n\nRespond naturally as Naren:`;

      const result = await ai.models.generateContent({
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

      const response = result.candidates[0].content.parts[0].text.trim();

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
