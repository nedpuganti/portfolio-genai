/**
 * Simple Conversation Management System
 * Handles repeated question detection, rate limiting, and basic context
 */
class ConversationManager {
  constructor() {
    this.conversations = new Map();
    this.limits = {
      maxRecentQuestions: 3, // Keep last 3 questions (portfolio conversations are brief)
      maxConversations: 5, // Max active conversations (minimal for portfolio)
      cleanupInterval: 30 * 60 * 1000, // 30 minutes (less frequent cleanup)
    };

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Start periodic cleanup
   */
  startCleanup() {
    setInterval(() => {
      this.cleanupOldConversations();
    }, this.limits.cleanupInterval);
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
        recentQuestions: [], // Keep last few questions for context
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
      question:
        question.substring(0, 150) + (question.length > 150 ? "..." : ""),
    };

    conversation.recentQuestions.push(messageEntry);
    conversation.lastActivity = Date.now();

    // Keep only recent questions
    if (conversation.recentQuestions.length > this.limits.maxRecentQuestions) {
      conversation.recentQuestions = conversation.recentQuestions.slice(
        -this.limits.maxRecentQuestions,
      );
    }
  }

  /**
   * Check for repeated questions
   */
  checkForRepeatedQuestion(userIdentifier, question) {
    const conversation = this.conversations.get(userIdentifier);
    if (!conversation || conversation.recentQuestions.length < 2) {
      return { isRepeated: false };
    }

    const lowerQuestion = question.toLowerCase();

    // Check last few questions for very similar ones
    const recentQuestions = conversation.recentQuestions.slice(-3);
    const similarQuestion = recentQuestions.find((msg) => {
      const msgLower = msg.question.toLowerCase();
      return this.calculateQuestionSimilarity(lowerQuestion, msgLower) > 0.8;
    });

    if (similarQuestion) {
      return {
        isRepeated: true,
        lastAsked: similarQuestion.timestamp,
        timeSinceLastAsked: Date.now() - similarQuestion.timestamp,
      };
    }

    return { isRepeated: false };
  }

  /**
   * Calculate similarity between two questions (kept simple)
   */
  calculateQuestionSimilarity(question1, question2) {
    const words1 = new Set(question1.split(/\s+/).filter((w) => w.length > 3));
    const words2 = new Set(question2.split(/\s+/).filter((w) => w.length > 3));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Generate simple conversation context if helpful
   */
  generateConversationContext(userIdentifier) {
    const conversation = this.conversations.get(userIdentifier);
    if (!conversation || conversation.recentQuestions.length < 3) {
      return "";
    }

    const questionCount = conversation.recentQuestions.length;
    return `\n\nCONVERSATION CONTEXT:\n- You've asked ${questionCount} questions in this session\n- This appears to be a multi-question portfolio inquiry`;
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
      conversation.recentQuestions = [];
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
      questionCount: conversation.recentQuestions.length,
      lastActivity: now - conversation.lastActivity,
      isActive: now - conversation.lastActivity < 30 * 60 * 1000, // 30 min
    };
  }
}

module.exports = { ConversationManager };
