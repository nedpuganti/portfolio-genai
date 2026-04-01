const express = require("express");
const router = express.Router();
const { PortfolioTools } = require("../core/tools");

// Initialize tools (single instance)
const portfolioTools = new PortfolioTools();

// Summary Information endpoint
router.get("/summary", (req, res) => {
  try {
    const summary = portfolioTools.getSummary();
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

// Contact Information endpoint
router.get("/contact", (req, res) => {
  try {
    const contactInfo = portfolioTools.getContactInfo();
    res.json(contactInfo);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contact information" });
  }
});

// Skills endpoint (with optional type parameter)
router.get("/skills", (req, res) => {
  try {
    const { type } = req.query; // ?type=hard|soft|all
    const skills = portfolioTools.getSkills(type);
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch skills" });
  }
});

// Experience endpoint
router.get("/experience", (req, res) => {
  try {
    const experience = portfolioTools.getExperience();
    res.json(experience);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch experience" });
  }
});

// Education endpoint
router.get("/education", (req, res) => {
  try {
    const education = portfolioTools.getEducation();
    res.json(education);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch education" });
  }
});

// Projects endpoint
router.get("/projects", (req, res) => {
  try {
    const projects = portfolioTools.getProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Services endpoint
router.get("/services", (req, res) => {
  try {
    const services = portfolioTools.getServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// Stats/Personal Info endpoint
router.get("/stats", (req, res) => {
  try {
    const stats = portfolioTools.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Additional Info endpoint
router.get("/additional", (req, res) => {
  try {
    const additionalInfo = portfolioTools.getAdditionalInfo();
    res.json(additionalInfo);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch additional information" });
  }
});

// All data endpoint (combined)
router.get("/all", (req, res) => {
  try {
    const allData = {
      summary: portfolioTools.getSummary(),
      contact: portfolioTools.getContactInfo(),
      skills: portfolioTools.getSkills(),
      experience: portfolioTools.getExperience(),
      education: portfolioTools.getEducation(),
      projects: portfolioTools.getProjects(),
      services: portfolioTools.getServices(),
      stats: portfolioTools.getStats(),
      additional: portfolioTools.getAdditionalInfo(),
    };
    res.json(allData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch portfolio data" });
  }
});

module.exports = router;
