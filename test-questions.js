const questions = [
  // Skills & Technical Questions
  "What backend technologies do you use?",
  "Are you familiar with databases?",
  "Do you know TypeScript?",
  "What testing frameworks do you use?",
  "Tell me about your React experience",
  "What mobile development tools do you work with?",
  "Do you use any CSS frameworks?",
  "What development tools do you prefer?",
  "Are you experienced with cloud platforms?",
  "What APIs have you worked with?",

  // Experience & Career Questions
  "How long have you been a developer?",
  "What's your job title?",
  "Tell me about your work history",
  "What companies have you worked for?",
  "What's your employment status?",
  "Describe your current responsibilities",
  "What industries have you worked in?",
  "How many years of Node.js experience do you have?",

  // Project Questions
  "What's your most recent project?",
  "Show me your best work",
  "What mobile apps have you built?",
  "Tell me about a challenging project",
  "What web applications have you created?",
  "Have you built any e-commerce sites?",
  "What's your favorite project you've worked on?",
  "Do you have any open source projects?",

  // Education Questions
  "What's your educational qualification?",
  "Where did you get your degree?",
  "Tell me about your computer science background",
  "What did you study in university?",
  "Do you have any certifications?",

  // Contact & Availability
  "What's your phone number?",
  "How can I hire you?",
  "Are you available for freelance work?",
  "What's your website?",
  "Can I see your portfolio?",

  // Portfolio Statistics
  "How many projects have you completed?",
  "What are your statistics?",
  "How many years of experience?",
  "Show me your portfolio metrics",

  // Services Questions
  "What services do you offer?",
  "Do you do consulting?",
  "Can you build mobile apps?",
  "Do you offer maintenance?",

  // Quick Test Questions
  "React",
  "Angular skills",
  "Phone number",
  "Current job",
  "Projects",

  // Edge Cases & Complex Questions
  "Do you know both Angular and React?",
  "What's the difference between your frontend and backend skills?",
  "Can you work remotely?",
  "What's your hourly rate?",
  "Tell me about your team experience",
];

async function testQuestions() {
  const failed = [];
  const lowConfidence = [];
  const passed = [];

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    try {
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: question }),
      });

      const data = await response.json();
      const answer = data.answer || "";

      // Check for failure patterns
      if (
        answer.includes("I don't have enough specific information") ||
        answer.includes("I'm not confident I can provide") ||
        answer.includes("I'd rather not guess") ||
        answer.includes("I can help with questions about skills")
      ) {
        failed.push({ question, answer: answer.substring(0, 80) + "..." });
      } else if (answer.includes("⚠️") || answer.includes("lower confidence")) {
        lowConfidence.push({
          question,
          answer: answer.substring(0, 80) + "...",
        });
      } else if (answer.includes("I just answered a similar question")) {
        // Skip repeated questions for cleaner results
        continue;
      } else {
        passed.push({ question });
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      failed.push({ question, error: error.message });
    }

    if (i % 5 === 0) console.log(`Progress: ${i}/${questions.length}`);
  }

  console.log("\n=== TEST RESULTS ===");
  console.log(`✅ PASSED: ${passed.length}`);
  console.log(`⚠️  LOW CONFIDENCE: ${lowConfidence.length}`);
  console.log(`❌ FAILED: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\n❌ FAILED QUESTIONS:");
    failed.forEach((item, i) => {
      console.log(`${i + 1}. "${item.question}"`);
      if (item.error) {
        console.log(`   ERROR: ${item.error}`);
      } else {
        console.log(`   RESPONSE: ${item.answer}`);
      }
    });
  }

  if (lowConfidence.length > 0) {
    console.log("\n⚠️  LOW CONFIDENCE RESPONSES:");
    lowConfidence.forEach((item, i) => {
      console.log(`${i + 1}. "${item.question}"`);
      console.log(`   RESPONSE: ${item.answer}`);
    });
  }
}

testQuestions().catch(console.error);
