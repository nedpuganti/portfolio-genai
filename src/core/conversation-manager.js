const { summarizeForMemory } = require("./response-utils");

/**
 * Simple Conversation Management System
 * Handles repeated question detection, rate limiting, and basic context
 */
class ConversationManager {
  constructor() {
    this.conversations = new Map();
    this.limits = {
      maxRecentQuestions: 3, // Keep last 3 questions (portfolio conversations are brief)
      maxConversations: 25, // Small but more practical for a public portfolio
      cleanupInterval: 30 * 60 * 1000, // 30 minutes (less frequent cleanup)
    };

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Start periodic cleanup
   */
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldConversations();
    }, this.limits.cleanupInterval);

    if (typeof this.cleanupTimer.unref === "function") {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Get or create simple conversation for user
   */
  getConversation(userIdentifier) {
    const now = Date.now();
    let conversation = this.conversations.get(userIdentifier);

    if (!conversation) {
      // Clean up if at capacity
      if (this.conversations.size >= this.limits.maxConversations) {
        this.cleanupOldestConversations();
      }

      conversation = {
        lastActivity: now,
        recentExchanges: [], // Keep last few exchanges for context
      };
      this.conversations.set(userIdentifier, conversation);
    }

    conversation.lastActivity = now;
    return conversation;
  }

  /**
   * Add question to conversation history (simplified)
   */
  addMessageToConversation(userIdentifier, question, response) {
    const conversation = this.getConversation(userIdentifier);

    const messageEntry = {
      timestamp: Date.now(),
      question: summarizeForMemory(question, 150),
      responseSummary: summarizeForMemory(response, 180),
    };

    conversation.recentExchanges.push(messageEntry);
    conversation.lastActivity = Date.now();

    // Keep only recent questions
    if (conversation.recentExchanges.length > this.limits.maxRecentQuestions) {
      conversation.recentExchanges = conversation.recentExchanges.slice(
        -this.limits.maxRecentQuestions,
      );
    }
  }

  /**
   * Check for repeated questions
   */
  checkForRepeatedQuestion(userIdentifier, question) {
    const conversation = this.conversations.get(userIdentifier);
    if (!conversation || conversation.recentExchanges.length === 0) {
      return { isRepeated: false };
    }

    const lowerQuestion = question.toLowerCase();

    // Check last few questions for very similar ones
    const recentQuestions = conversation.recentExchanges.slice(-3);
    const similarQuestion = recentQuestions.find((msg) => {
      const msgLower = msg.question.toLowerCase();
      return this.calculateQuestionSimilarity(lowerQuestion, msgLower) > 0.65;
    });

    if (similarQuestion) {
      return {
        isRepeated: true,
        lastAsked: similarQuestion.timestamp,
        timeSinceLastAsked: Date.now() - similarQuestion.timestamp,
        previousResponseSummary: similarQuestion.responseSummary,
      };
    }

    return { isRepeated: false };
  }

  /**
   * Calculate similarity between two questions (kept simple)
   */
  calculateQuestionSimilarity(question1, question2) {
    const words1 = new Set(
      question1
        .replace(/[^a-z0-9\s]+/gi, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );
    const words2 = new Set(
      question2
        .replace(/[^a-z0-9\s]+/gi, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  isFollowUpQuestion(question) {
    return /\b(more|more about that|tell me more|expand|elaborate|that|those|it|this one|what about)\b/i.test(
      question,
    );
  }

  /**
   * Generate simple conversation context if helpful
   */
  generateConversationContext(userIdentifier, currentQuestion = "") {
    const conversation = this.conversations.get(userIdentifier);
    if (!conversation || conversation.recentExchanges.length === 0) {
      return "";
    }

    const recentContext = conversation.recentExchanges
      .slice(-2)
      .map(
        (entry, index) =>
          `${index + 1}. Question: ${entry.question}\n   Answer summary: ${entry.responseSummary}`,
      )
      .join("\n");

    const followUpHint =
      this.isFollowUpQuestion(currentQuestion) &&
      conversation.recentExchanges.at(-1)?.responseSummary
        ? `\nCurrent question looks like a follow-up. Most recent answer summary: ${conversation.recentExchanges.at(-1).responseSummary}`
        : "";

    return `Recent exchanges:\n${recentContext}${followUpHint}`;
  }

  /**
   * Clean up old conversations (simplified)
   */
  cleanupOldConversations() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [userId, conversation] of this.conversations) {
      const inactiveTime = now - conversation.lastActivity;

      // Remove conversations inactive for over 30 minutes
      if (inactiveTime > 30 * 60 * 1000) {
        this.conversations.delete(userId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(
        `[CLEANUP] Removed ${cleanedCount} old conversations. Active: ${this.conversations.size}`,
      );
    }
  }

  /**
   * Clean up oldest conversations when at capacity
   */
  cleanupOldestConversations() {
    const conversations = Array.from(this.conversations.entries()).sort(
      (a, b) => a[1].lastActivity - b[1].lastActivity,
    );

    const toRemove = 1; // Just remove oldest conversation for small portfolio scale
    for (let i = 0; i < toRemove; i++) {
      this.conversations.delete(conversations[i][0]);
    }

    console.log(
      `[CLEANUP] Removed ${toRemove} oldest conversations due to capacity`,
    );
  }

  /**
   * Simple conversation limits check (no session timeouts)
   */
  checkConversationLimits(userIdentifier) {
    // For portfolio chatbot, we don't need strict limits
    // Just basic spam protection is handled by SecurityValidator
    return { allowed: true };
  }

  /**
   * Reset conversation for user (simplified)
   */
  resetConversation(userIdentifier) {
    const conversation = this.conversations.get(userIdentifier);
    if (conversation) {
      conversation.lastActivity = Date.now();
      conversation.recentExchanges = [];
    }
  }

  /**
   * Get simple conversation statistics
   */
  getConversationStats(userIdentifier) {
    const conversation = this.conversations.get(userIdentifier);
    if (!conversation) {
      return { exists: false };
    }

    const now = Date.now();
    return {
      exists: true,
      questionCount: conversation.recentExchanges.length,
      lastActivity: now - conversation.lastActivity,
      isActive: now - conversation.lastActivity < 30 * 60 * 1000, // 30 min
    };
  }
}

module.exports = { ConversationManager };
