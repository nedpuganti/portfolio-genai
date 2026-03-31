const { getContext } = require("./context");

/**
 * Internal tools system for portfolio AI to use specific functions
 */
class PortfolioTools {
  constructor() {
    this.context = null;
    this.data = {};
    this.loadData();
  }

  loadData() {
    try {
      this.data = {
        personal: require("../data/personal-data.js"),
        skills: require("../data/skills-data.js"),
        education: require("../data/education-data.js"),
        experience: require("../data/experience-data.js"),
        projects: require("../data/projects-data.js"),
        services: require("../data/services-data.js"),
      };
    } catch (error) {
      console.error("Error loading data:", error);
      this.data = {};
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
      const { contactInfo } = this.data.personal;
      return {
        phone: contactInfo.phoneNumber,
        email: contactInfo.email,
        website: contactInfo.website,
        address: contactInfo.address,
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
      const { hardSkills, softSkills } = this.data.skills;

      switch (type) {
        case "hard":
          return { hardSkills };
        case "soft":
          return { softSkills };
        case "all":
        default:
          return {
            hardSkills,
            softSkills,
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
      const { experience } = this.data.experience;
      return experience;
    } catch (error) {
      return { error: "Experience information not available" };
    }
  }

  /**
   * Get education information
   */
  getEducation() {
    try {
      const { education } = this.data.education;
      return education;
    } catch (error) {
      return { error: "Education information not available" };
    }
  }

  /**
   * Get projects information
   */
  getProjects() {
    try {
      const { projects } = this.data.projects;
      return projects;
    } catch (error) {
      return { error: "Projects information not available" };
    }
  }

  /**
   * Get services information
   */
  getServices() {
    try {
      const { services } = this.data.services;
      return services;
    } catch (error) {
      return { error: "Services information not available" };
    }
  }

  /**
   * Calculate years of experience from experience data
   */
  calculateYearsOfExperience() {
    try {
      const { experience } = this.data.experience;
      if (!experience || !Array.isArray(experience)) {
        return 8; // fallback
      }

      const currentYear = new Date().getFullYear();
      let totalYears = 0;

      for (const exp of experience) {
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
      const { personalInfo, funFacts } = this.data.personal;
      const yearsExperience = this.calculateYearsOfExperience();
      const personalData = personalInfo(yearsExperience);
      const funFactsData = funFacts(yearsExperience);

      return {
        yearsExperience,
        summary: personalData.summary,
        stats: funFactsData,
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
