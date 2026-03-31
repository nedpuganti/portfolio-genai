const { GoogleGenAI } = require("@google/genai");
const { getContext } = require("./context");
const { PortfolioTools } = require("./tools");
const { ConversationManager } = require("./conversation-manager");
const { SecurityValidator } = require("./security-validator");
const { ConfidenceAssessor } = require("./confidence-assessor");
const { AmbiguityDetector } = require("./ambiguity-detector");
const { ToolSelector } = require("./tool-selector");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const portfolioTools = new PortfolioTools();

/**
 * Enhanced AI that uses portfolio tools for smart responses
 * Main orchestrator class that coordinates all AI functionality
 */
class EnhancedPortfolioAI {
  constructor() {
    this.baseSystemPrompt = `
You are a friendly portfolio assistant answering questions about Naren's professional background. Talk like a normal person having a conversation.

TONE & STYLE:
- Never start with "Based on the data" or "According to the information" or "Based on the skills summary"
- Don't sound like a report or business document
- Just answer directly like you're chatting with someone
- Be casual and personable, not formal

RULES:
- Only use the portfolio information provided
- If you don't know something, just say "I don't have that info" casually
- Don't make stuff up
- Stick to what's in Naren's actual portfolio data
`;

    // Initialize all modules
    this.conversationManager = new ConversationManager();
    this.securityValidator = new SecurityValidator();
    this.confidenceAssessor = new ConfidenceAssessor();
    this.ambiguityDetector = new AmbiguityDetector();
    this.toolSelector = new ToolSelector(process.env.GEMINI_API_KEY);
  }

  /**
   * Main function to ask AI with intelligent tool selection and security
   */
  async ask(question, userIdentifier = "anonymous") {
    try {
      // 0. Rate Limiting
      if (!this.securityValidator.checkRateLimit(userIdentifier)) {
        return "Too many requests. Please wait a moment before trying again.";
      }

      // 0.5. Conversation Limits Check
      const conversationCheck =
        this.conversationManager.checkConversationLimits(userIdentifier);
      if (!conversationCheck.allowed) {
        this.securityValidator.logSecurityEvent(
          "CONVERSATION_LIMIT_EXCEEDED",
          question,
          {
            reason: conversationCheck.reason,
            userIdentifier,
          },
        );

        if (conversationCheck.reason === "message_limit_exceeded") {
          return conversationCheck.message;
        }

        return "Your conversation session has been reset. How can I help you today?";
      }

      // 1. Input Validation
      const inputValidation = this.securityValidator.validateInput(question);
      if (!inputValidation.isValid) {
        this.securityValidator.logSecurityEvent(
          "INPUT_VALIDATION_FAILED",
          question,
          {
            issues: inputValidation.issues,
          },
        );
        return "I can't process this request due to security concerns. Please rephrase your question.";
      }

      // 2. Intent Validation
      const intentValidation = this.securityValidator.validateIntent(question);
      if (intentValidation.isOffTopic) {
        this.securityValidator.logSecurityEvent("OFF_TOPIC_ATTEMPT", question, {
          reason: "off_topic",
        });
        return "I'm a portfolio assistant and can only answer questions about professional background, skills, experience, projects, and contact information.";
      }
      if (!intentValidation.isPortfolioRelated) {
        return "I can help with questions about skills, experience, projects, education, services, and contact information. How can I assist you with portfolio-related information?";
      }

      // 3. Ambiguity Check
      const ambiguityCheck = this.ambiguityDetector.checkAmbiguity(question);
      if (ambiguityCheck.needsClarification) {
        this.securityValidator.logSecurityEvent(
          "AMBIGUOUS_QUESTION",
          question,
          {
            issues: ambiguityCheck.issues,
            severity: ambiguityCheck.severity,
          },
        );
        return this.ambiguityDetector.generateClarificationRequest(
          question,
          ambiguityCheck,
        );
      }

      // 3.5. Repeated Question Detection
      const repeatedCheck = this.conversationManager.checkForRepeatedQuestion(
        userIdentifier,
        question,
      );
      if (repeatedCheck.isRepeated) {
        const timeDiff = repeatedCheck.timeSinceLastAsked;
        const minutesAgo = Math.round(timeDiff / (1000 * 60));

        if (timeDiff < 2 * 60 * 1000) {
          // Less than 2 minutes ago
          this.securityValidator.logSecurityEvent(
            "REPEATED_QUESTION",
            question,
            {
              category: repeatedCheck.category,
              timeSinceLastAsked: minutesAgo,
            },
          );

          return `I just answered a similar question about ${repeatedCheck.category} ${minutesAgo < 1 ? "less than a minute" : `${minutesAgo} minute${minutesAgo === 1 ? "" : "s"}`} ago. Would you like me to elaborate on a specific aspect, or do you have a different question?`;
        }
      }

      // 4. Use AI to intelligently select and get relevant data
      const { toolData, toolSelection } =
        await this.toolSelector.getRelevantData(question, portfolioTools);

      // 5. Confidence Assessment
      const confidence = this.confidenceAssessor.assessConfidence(
        question,
        toolData,
        toolSelection,
      );

      // Log confidence for monitoring (reduced logging for performance)
      if (confidence.level === "low" || confidence.level === "very_low") {
        console.log(
          `[CONFIDENCE] Low confidence detected: ${confidence.score}% | Level: ${confidence.level}`,
        );
      }

      if (!confidence.shouldProceed) {
        this.securityValidator.logSecurityEvent(
          "LOW_CONFIDENCE_RESPONSE",
          question,
          {
            confidenceScore: confidence.score,
            confidenceLevel: confidence.level,
            factors: confidence.factors,
          },
        );
        return this.confidenceAssessor.generateLowConfidenceResponse(
          question,
          confidence,
        );
      }

      const generalContext = getContext();

      // 6. Build enhanced context with anti-hallucination rules
      let enhancedContext = "";
      if (Object.keys(toolData).length > 0) {
        enhancedContext = `\n\nRELEVANT PORTFOLIO DATA:\n${JSON.stringify(toolData, null, 2)}\n`;
      }

      // Add conversation context for better responses (when helpful)
      const conversationContext =
        this.conversationManager.generateConversationContext(userIdentifier);

      // Enhanced system prompt with guardrails and confidence info
      const securePrompt = `
You are Naren responding to questions about your professional background.

EXAMPLE INTERACTION:
Q: "What programming languages do you know?"
A: "I work with JavaScript, TypeScript, React, Angular, Node.js, and several others. On the frontend I'm really comfortable with React and Angular, and I use Node.js for backend development. I also know C# for some .NET projects and I'm familiar with database languages like SQL and NoSQL."

NEVER start responses with "Based on" or "According to" or reference any data sources. Just answer as yourself.

PORTFOLIO INFO:
${generalContext}${enhancedContext}${conversationContext}

USER QUESTION: ${question}

Respond naturally as Naren:
`;

      // 7. Call the AI with security constraints
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: securePrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7, // Higher temperature for more natural, less formulaic responses
          maxOutputTokens: 1000, // Reduced for faster responses
          topP: 0.8,
          topK: 40,
        },
        requestOptions: {
          timeout: 8000, // Reduced timeout for faster responses
        },
      });

      let response = result.candidates[0].content.parts[0].text;

      // 8. Skip response ambiguity check for simple tech questions (performance optimization)
      const isSimpleTechQuestion =
        /\b(know|use|familiar with|work with)\s+\w+/.test(
          question.toLowerCase(),
        );

      if (!isSimpleTechQuestion) {
        const responseAmbiguityCheck =
          this.ambiguityDetector.checkResponseAmbiguity(response, question);
        if (responseAmbiguityCheck.requiresRevision) {
          console.warn(
            "Response ambiguity detected:",
            responseAmbiguityCheck.issues,
          );
          this.securityValidator.logSecurityEvent(
            "AMBIGUOUS_RESPONSE",
            question,
            {
              responseIssues: responseAmbiguityCheck.issues,
              originalResponse: response.substring(0, 100),
            },
          );
          response =
            "I want to provide you with clear, specific information. Let me try to be more precise with my answer, or you could ask me to focus on a particular aspect of your question.";
        }
      }

      // 9. Response Validation with Confidence Context
      const responseValidation = this.securityValidator.validateResponse(
        response,
        toolData,
      );
      if (!responseValidation.isValid) {
        console.warn("Response validation issues:", responseValidation.issues);
        this.securityValidator.logSecurityEvent(
          "RESPONSE_VALIDATION_FAILED",
          question,
          {
            issues: responseValidation.issues,
            confidenceScore: confidence.score,
          },
        );

        // For low confidence + failed validation, be extra cautious
        if (confidence.level === "low" || confidence.level === "very_low") {
          response =
            "I'm not confident enough in my answer to provide accurate information. Please try asking about specific skills, experience, projects, or contact information.";
        } else {
          response =
            "I'm having trouble providing accurate information right now. Please try rephrasing your question or contact directly for more details.";
        }
      }

      // 10. Apply Guardrails with confidence adjustments
      response = this.securityValidator.applyGuardrails(
        question,
        response,
        confidence,
      );

      // 12. Post-process response to make it more conversational
      response = this.makeResponseConversational(response);

      // 13. Redaction
      response = this.securityValidator.redactSensitiveInfo(response);

      // 14. Log successful interaction with confidence and ambiguity checks
      console.log(
        `[AI] Question processed successfully for ${userIdentifier} | Confidence: ${confidence.score}% | Ambiguity: ${ambiguityCheck.hasAmbiguity ? "detected" : "clear"}`,
      );

      // 15. Add to conversation tracking
      this.conversationManager.addMessageToConversation(
        userIdentifier,
        question,
        response,
      );

      return response;
    } catch (error) {
      console.error("AI Error:", error);
      this.securityValidator.logSecurityEvent("AI_ERROR", question, {
        error: error.message,
        status: error.status,
      });

      // Enhanced error handling with security
      let errorResponse =
        "I'm having trouble processing your request right now. Please try again later.";

      if (error.status === 429) {
        errorResponse =
          "I'm currently experiencing high usage. Please try again later or contact the portfolio owner directly.";
      } else if (error.status === 404) {
        errorResponse =
          "The AI service is temporarily unavailable. Please try again later.";
      } else if (error.message && error.message.includes("safety")) {
        errorResponse =
          "I can't process this request. Please rephrase your question to focus on portfolio-related topics.";
      }

      // Track error responses in conversation
      this.conversationManager.addMessageToConversation(
        userIdentifier,
        question,
        `[ERROR] ${errorResponse}`,
      );

      return errorResponse;
    }
  }

  /**
   * Convert formal AI responses to conversational tone
   */
  makeResponseConversational(response) {
    // Replace formal openings with natural ones
    console.log("[CONVERSION] Original response:", response.substring(0, 100));

    const formalPatterns = [
      {
        pattern:
          /^Based on the (skills summary|portfolio|data|information|provided data)[,\s]*(here are|I can tell you|the following shows|these are)?[:\s]*/i,
        replacement: "",
      },
      {
        pattern: /^According to the (portfolio|information|data)[,\s]*/i,
        replacement: "",
      },
      {
        pattern: /^From the (portfolio|data|information)[,\s]*/i,
        replacement: "",
      },
      {
        pattern: /^The (portfolio|data|information) (shows|indicates)[,\s]*/i,
        replacement: "",
      },
      {
        pattern: /^Here are the programming languages[,\s]*/i,
        replacement: "I work with ",
      },
      { pattern: /^Here are[,\s]*the[,\s]*/i, replacement: "I have " },
      {
        pattern: /Naren Edpuganti (knows|has|uses|works with)/gi,
        replacement: "I $1",
      },
      {
        pattern: /Naren('s|s)? (programming|technical|main)/gi,
        replacement: "My $2",
      },
      { pattern: /\bNaren Edpuganti\b/g, replacement: "I" },
    ];

    let conversationalResponse = response;

    // Apply pattern replacements
    for (const { pattern, replacement } of formalPatterns) {
      const before = conversationalResponse;
      conversationalResponse = conversationalResponse.replace(
        pattern,
        replacement,
      );
      if (before !== conversationalResponse) {
        console.log("[CONVERSION] Applied pattern:", pattern.toString());
      }
    }

    // Clean up any double spaces or awkward pacing
    conversationalResponse = conversationalResponse.replace(/\s+/g, " ").trim();

    // Make sure it starts with a capital letter
    if (conversationalResponse.length > 0) {
      conversationalResponse =
        conversationalResponse.charAt(0).toUpperCase() +
        conversationalResponse.slice(1);
    }

    console.log(
      "[CONVERSION] Final response:",
      conversationalResponse.substring(0, 100),
    );
    return conversationalResponse;
  }

  // ConversationManager handles all conversation logic internally
}

// Export
const enhancedAI = new EnhancedPortfolioAI();

async function askAI(question, userIdentifier = "anonymous") {
  return enhancedAI.ask(question, userIdentifier);
}

module.exports = {
  askAI,
  EnhancedPortfolioAI,
  enhancedAI,
};
