/**
 * Smart Conversation Management System
 * Handles conversation tracking, categorization, optimization, and limits
 */
class ConversationManager {
  constructor() {
    this.conversations = new Map();
    this.conversationLimits = {
      maxMessagesPerConversation: 50,
      maxConversationDuration: 30 * 60 * 1000, // 30 minutes
      optimizationThreshold: 15, // Optimize when exceeding this many messages
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      maxActiveConversations: 100,
    };

    // Start periodic cleanup
    this.startConversationCleanup();
  }

  /**
   * Start periodic conversation cleanup
   */
  startConversationCleanup() {
    setInterval(() => {
      this.cleanupExpiredConversations();
    }, this.conversationLimits.cleanupInterval);
  }

  /**
   * Get or create conversation for user
   */
  getConversation(userIdentifier) {
    const now = Date.now();
    let conversation = this.conversations.get(userIdentifier);

    if (!conversation) {
      if (
        this.conversations.size >=
        this.conversationLimits.maxActiveConversations
      ) {
        this.cleanupOldestConversations();
      }

      conversation = {
        userId: userIdentifier,
        messageCount: 0,
        startTime: now,
        lastActivity: now,
        messages: [],
        topicsSeen: new Set(),
        optimizations: 0,
      };
      this.conversations.set(userIdentifier, conversation);
    }

    conversation.lastActivity = now;
    return conversation;
  }

  /**
   * Categorize questions into portfolio topics
   */
  categorizeQuestion(question) {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.match(/\b(email|phone|contact|reach|website)\b/))
      return "contact";
    if (
      lowerQuestion.match(
        /\b(skills|technologies|tech|programming|languages)\b/,
      )
    )
      return "skills";
    if (lowerQuestion.match(/\b(experience|work|job|career)\b/))
      return "experience";
    if (lowerQuestion.match(/\b(education|degree|university|college|school)\b/))
      return "education";
    if (lowerQuestion.match(/\b(projects|built|developed|created|portfolio)\b/))
      return "projects";
    if (lowerQuestion.match(/\b(services|capabilities|offer|help)\b/))
      return "services";
    if (lowerQuestion.match(/\b(years|statistics|how many|how much)\b/))
      return "stats";
    if (lowerQuestion.match(/\b(know|familiar|use|work with)\b/))
      return "technology_search";

    return "general";
  }

  /**
   * Add message to conversation with smart categorization
   */
  addMessageToConversation(userIdentifier, question, response) {
    const conversation = this.getConversation(userIdentifier);
    const questionCategory = this.categorizeQuestion(question);

    const messageEntry = {
      timestamp: Date.now(),
      question: question.substring(0, 200),
      response: response.substring(0, 500),
      questionLength: question.length,
      responseLength: response.length,
      category: questionCategory,
    };

    conversation.messages.push(messageEntry);
    conversation.messageCount++;
    conversation.lastActivity = Date.now();
    conversation.topicsSeen.add(questionCategory);

    // Smart conversation optimization when threshold exceeded
    if (
      conversation.messages.length >
      this.conversationLimits.optimizationThreshold
    ) {
      this.optimizeConversationHistory(conversation);
    }
  }

  /**
   * Optimize conversation history (smart sampling instead of summarization)
   */
  optimizeConversationHistory(conversation) {
    const messages = conversation.messages;

    // Keep recent 8 messages for fresh context
    const recentMessages = messages.slice(-8);
    const olderMessages = messages.slice(0, -8);

    // Group older messages by category
    const messagesByCategory = {};
    olderMessages.forEach((msg) => {
      if (!messagesByCategory[msg.category]) {
        messagesByCategory[msg.category] = [];
      }
      messagesByCategory[msg.category].push(msg);
    });

    // Keep 1-2 representative messages per topic from older messages
    const representativeMessages = [];
    Object.values(messagesByCategory).forEach((categoryMessages) => {
      // Keep the most recent from each category
      representativeMessages.push(
        categoryMessages[categoryMessages.length - 1],
      );

      // If many messages of this type, keep one more for context
      if (categoryMessages.length > 3) {
        const midIndex = Math.floor(categoryMessages.length / 2);
        representativeMessages.push(categoryMessages[midIndex]);
      }
    });

    // Update conversation with optimized history
    conversation.messages = [...representativeMessages, ...recentMessages];
    conversation.optimizations++;

    console.log(
      `[CONV_OPT] Optimized conversation for ${conversation.userId}. Messages: ${messages.length} → ${conversation.messages.length}`,
    );
  }

  /**
   * Check for repeated questions to improve UX
   */
  checkForRepeatedQuestion(userIdentifier, question) {
    const conversation = this.conversations.get(userIdentifier);
    if (!conversation || conversation.messages.length < 2) {
      return { isRepeated: false };
    }

    const questionCategory = this.categorizeQuestion(question);
    const lowerQuestion = question.toLowerCase();

    // Check last 5 messages for similar questions
    const recentMessages = conversation.messages.slice(-5);
    const similarQuestions = recentMessages.filter((msg) => {
      const msgLower = msg.question.toLowerCase();
      return (
        msg.category === questionCategory &&
        this.calculateQuestionSimilarity(lowerQuestion, msgLower) > 0.7
      );
    });

    if (similarQuestions.length > 0) {
      const lastSimilar = similarQuestions[similarQuestions.length - 1];
      return {
        isRepeated: true,
        category: questionCategory,
        lastAsked: lastSimilar.timestamp,
        timeSinceLastAsked: Date.now() - lastSimilar.timestamp,
      };
    }

    return { isRepeated: false };
  }

  /**
   * Calculate similarity between two questions
   */
  calculateQuestionSimilarity(question1, question2) {
    const words1 = new Set(question1.split(/\s+/).filter((w) => w.length > 3));
    const words2 = new Set(question2.split(/\s+/).filter((w) => w.length > 3));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Generate lightweight conversation context for AI
   */
  generateConversationContext(userIdentifier) {
    const conversation = this.conversations.get(userIdentifier);
    if (!conversation || conversation.messageCount < 5) {
      return "";
    }

    const topicsSeen = Array.from(conversation.topicsSeen);
    const recentCategories = conversation.messages
      .slice(-3)
      .map((m) => m.category)
      .filter((cat, idx, arr) => arr.indexOf(cat) === idx);

    return `\n\nCONVERSATION CONTEXT:\n- Previous topics discussed: ${topicsSeen.join(", ")}\n- Total questions: ${conversation.messageCount}\n- Recent focus: ${recentCategories.join(", ")}\n- User seems interested in: ${topicsSeen.length > 3 ? "comprehensive portfolio information" : topicsSeen.join(" and ")}`;
  }

  /**
   * Clean up expired conversations
   */
  cleanupExpiredConversations() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [userId, conversation] of this.conversations) {
      const inactiveTime = now - conversation.lastActivity;
      const conversationAge = now - conversation.startTime;

      if (
        inactiveTime > 60 * 60 * 1000 ||
        conversationAge > 2 * 60 * 60 * 1000
      ) {
        this.conversations.delete(userId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(
        `[CLEANUP] Removed ${cleanedCount} expired conversations. Active: ${this.conversations.size}`,
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

    const toRemove = Math.ceil(conversations.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.conversations.delete(conversations[i][0]);
    }

    console.log(
      `[CLEANUP] Removed ${toRemove} oldest conversations due to capacity limit`,
    );
  }

  /**
   * Check conversation limits
   */
  checkConversationLimits(userIdentifier) {
    const conversation = this.getConversation(userIdentifier);
    const now = Date.now();

    // Check message count limit
    if (
      conversation.messageCount >=
      this.conversationLimits.maxMessagesPerConversation
    ) {
      return {
        allowed: false,
        reason: "message_limit_exceeded",
        message: `You've reached the maximum of ${this.conversationLimits.maxMessagesPerConversation} messages in this conversation. Please start a new session.`,
      };
    }

    // Check conversation duration
    const conversationAge = now - conversation.startTime;
    if (conversationAge > this.conversationLimits.maxConversationDuration) {
      this.resetConversation(userIdentifier);
      return {
        allowed: true,
        reason: "conversation_reset",
        message: "Your conversation session has been reset due to timeout.",
      };
    }

    return { allowed: true };
  }

  /**
   * Reset conversation for user
   */
  resetConversation(userIdentifier) {
    const conversation = this.conversations.get(userIdentifier);
    if (conversation) {
      conversation.messageCount = 0;
      conversation.startTime = Date.now();
      conversation.lastActivity = Date.now();
      conversation.messages = [];
      conversation.topicsSeen = new Set();
      conversation.optimizations = 0;
    }
  }

  /**
   * Get conversation statistics
   */
  getConversationStats(userIdentifier) {
    const conversation = this.conversations.get(userIdentifier);
    if (!conversation) {
      return { exists: false };
    }

    const now = Date.now();
    return {
      exists: true,
      messageCount: conversation.messageCount,
      remainingMessages:
        this.conversationLimits.maxMessagesPerConversation -
        conversation.messageCount,
      conversationAge: now - conversation.startTime,
      lastActivity: now - conversation.lastActivity,
      isNearLimit:
        conversation.messageCount >=
        this.conversationLimits.maxMessagesPerConversation * 0.8,
      topicsSeen: Array.from(conversation.topicsSeen),
      optimizations: conversation.optimizations,
    };
  }
}

module.exports = { ConversationManager };
