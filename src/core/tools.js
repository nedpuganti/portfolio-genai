const { getContext } = require("./context");

/**
 * Internal tools system for portfolio AI to use specific functions
 */
class PortfolioTools {
  constructor() {
    this.context = null;
    this.mockData = {};
    this.loadMockData();
  }

  loadMockData() {
    try {
      this.mockData = {
        personal: require("../mocks/personal-data.mock.js"),
        skills: require("../mocks/skills-data.mock.js"),
        education: require("../mocks/education-data.mock.js"),
        experience: require("../mocks/experience-data.mock.js"),
        projects: require("../mocks/projects-data.mock.js"),
        services: require("../mocks/services-data.mock.js"),
      };
    } catch (error) {
      console.error("Error loading mock data:", error);
      this.mockData = {};
    }
  }

  getFullContext() {
    if (!this.context) {
      this.context = getContext();
    }
    return this.context;
  }

  /**
   * Get contact information
   */
  getContactInfo() {
    try {
      const { mockContactInfo } = this.mockData.personal;
      return {
        phone: mockContactInfo.phoneNumber,
        email: mockContactInfo.email,
        website: mockContactInfo.website,
        address: mockContactInfo.address,
      };
    } catch (error) {
      return { error: "Contact information not available" };
    }
  }

  /**
   * Get skills summary
   */
  getSkills(type = "all") {
    try {
      const { mockHardSkills, mockSoftSkills } = this.mockData.skills;

      switch (type) {
        case "hard":
          return { hardSkills: mockHardSkills };
        case "soft":
          return { softSkills: mockSoftSkills };
        case "all":
        default:
          return {
            hardSkills: mockHardSkills,
            softSkills: mockSoftSkills,
          };
      }
    } catch (error) {
      return { error: "Skills information not available" };
    }
  }

  /**
   * Get experience information
   */
  getExperience() {
    try {
      const { mockExperience } = this.mockData.experience;
      return mockExperience;
    } catch (error) {
      return { error: "Experience information not available" };
    }
  }

  /**
   * Get education information
   */
  getEducation() {
    try {
      const { mockEducation } = this.mockData.education;
      return mockEducation;
    } catch (error) {
      return { error: "Education information not available" };
    }
  }

  /**
   * Get projects information
   */
  getProjects() {
    try {
      const { mocksProjects } = this.mockData.projects;
      return mocksProjects;
    } catch (error) {
      return { error: "Projects information not available" };
    }
  }

  /**
   * Get services information
   */
  getServices() {
    try {
      const { mockServices } = this.mockData.services;
      return mockServices;
    } catch (error) {
      return { error: "Services information not available" };
    }
  }

  /**
   * Calculate years of experience from experience data
   */
  calculateYearsOfExperience() {
    try {
      const { mockExperience } = this.mockData.experience;
      if (!mockExperience || !Array.isArray(mockExperience)) {
        return 8; // fallback
      }

      const currentYear = new Date().getFullYear();
      let totalYears = 0;

      for (const exp of mockExperience) {
        const when = exp.when.toLowerCase();

        if (when.includes("present")) {
          // Handle "2016 - Present" format
          const startYear = parseInt(when.match(/(\d{4})/)?.[1] || currentYear);
          totalYears += currentYear - startYear;
        } else if (when.includes("-")) {
          // Handle "2014 - 2016" format
          const years = when.match(/(\d{4})/g);
          if (years && years.length >= 2) {
            const startYear = parseInt(years[0]);
            const endYear = parseInt(years[1]);
            totalYears += endYear - startYear;
          }
        }
      }

      return totalYears > 0 ? totalYears : 8; // fallback to 8 if calculation fails
    } catch (error) {
      console.warn("Error calculating years of experience:", error);
      return 8; // fallback
    }
  }

  /**
   * Get portfolio statistics
   */
  getStats() {
    try {
      const { mockPersonalInfo, mockFunFacts } = this.mockData.personal;
      const yearsExperience = this.calculateYearsOfExperience();
      const personalInfo = mockPersonalInfo(yearsExperience);
      const funFacts = mockFunFacts(yearsExperience);

      return {
        yearsExperience,
        summary: personalInfo.summary,
        stats: funFacts,
      };
    } catch (error) {
      return { error: "Statistics not available" };
    }
  }

  /**
   * Get additional professional information (certifications, industries, APIs, cloud experience)
   */
  getAdditionalInfo() {
    return {
      certifications: [], // No formal certifications
      industries: [
        "Healthcare Technology",
        "E-commerce",
        "Financial Services",
        "SaaS Platforms",
        "Mobile Applications",
      ],
      cloudPlatforms: [
        "Amazon Web Services (AWS)",
        "Google Cloud Platform (GCP)",
        "Microsoft Azure",
        "Heroku",
        "Vercel",
      ],
      APIs: [
        "RESTful APIs",
        "GraphQL",
        "Payment APIs (Stripe, PayPal)",
        "Social Media APIs (Facebook, Twitter)",
        "Google Maps API",
        "Third-party integrations",
        "Microservices APIs",
      ],
      developmentTools: [
        "Visual Studio Code",
        "WebStorm",
        "Git & GitHub",
        "Docker",
        "Webpack",
        "npm/yarn",
        "Chrome DevTools",
        "Postman",
        "Figma",
      ],
    };
  }

  /**
   * Search within portfolio data
   */
  searchPortfolio(query) {
    const context = this.getFullContext().toLowerCase();
    const searchTerm = query.toLowerCase();

    const lines = context.split("\n");
    const matchingLines = lines.filter((line) =>
      line.toLowerCase().includes(searchTerm),
    );

    return {
      query,
      results: matchingLines.slice(0, 10), // Limit to 10 results
      resultCount: matchingLines.length,
    };
  }
}

module.exports = { PortfolioTools };
