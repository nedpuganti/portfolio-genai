const { getContext } = require("./context");

function normalizeSearchValue(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function filterCollectionBySearchTerms(collection, searchTerms = []) {
  if (!Array.isArray(collection) || !Array.isArray(searchTerms) || searchTerms.length === 0) {
    return collection;
  }

  const normalizedTerms = searchTerms
    .map((term) => normalizeSearchValue(term))
    .filter(Boolean);

  if (normalizedTerms.length === 0) {
    return collection;
  }

  const filtered = collection.filter((item) => {
    const haystack = normalizeSearchValue(JSON.stringify(item));
    return normalizedTerms.some((term) => haystack.includes(term));
  });

  return filtered.length > 0 ? filtered : collection;
}

function getServiceByName(services = [], name) {
  return services.find((service) => service.name === name);
}

function cloneArray(values = []) {
  return Array.isArray(values) ? [...values] : [];
}

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
      return contactInfo;
    } catch (error) {
      return { error: "Contact information not available" };
    }
  }

  /**
   * Get skills summary
   */
  getSkills(type = "all", options = {}) {
    try {
      const { hardSkills, softSkills } = this.data.skills;
      const searchTerms = options.searchTerms || [];
      const filteredHardSkills = filterCollectionBySearchTerms(
        hardSkills,
        searchTerms,
      );
      const filteredSoftSkills = filterCollectionBySearchTerms(
        softSkills,
        searchTerms,
      );

      switch (type) {
        case "hard":
          return { hardSkills: filteredHardSkills };
        case "soft":
          return { softSkills: filteredSoftSkills };
        case "all":
        default:
          return {
            hardSkills: filteredHardSkills,
            softSkills: filteredSoftSkills,
          };
      }
    } catch (error) {
      return { error: "Skills information not available" };
    }
  }

  /**
   * Get experience information
   */
  getExperience(options = {}) {
    try {
      const { experience } = this.data.experience;
      return filterCollectionBySearchTerms(experience, options.searchTerms);
    } catch (error) {
      return { error: "Experience information not available" };
    }
  }

  /**
   * Get education information
   */
  getEducation(options = {}) {
    try {
      const { education } = this.data.education;
      return filterCollectionBySearchTerms(education, options.searchTerms);
    } catch (error) {
      return { error: "Education information not available" };
    }
  }

  /**
   * Get projects information
   */
  getProjects(options = {}) {
    try {
      const { projects } = this.data.projects;
      return filterCollectionBySearchTerms(projects, options.searchTerms);
    } catch (error) {
      return { error: "Projects information not available" };
    }
  }

  /**
   * Get services information
   */
  getServices(options = {}) {
    try {
      const { services } = this.data.services;
      return filterCollectionBySearchTerms(services, options.searchTerms);
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
        throw new Error("Experience data not found");
      }

      const currentYear = new Date().getFullYear();
      let minYear = currentYear;
      let maxYear = 0;

      // Find min start year and max end year from all experience entries
      for (const exp of experience) {
        const when = exp.when.toLowerCase();

        if (when.includes("present")) {
          // Handle "2016 - Present" format
          const startYear = parseInt(when.match(/(\d{4})/)?.[1] || currentYear);
          minYear = Math.min(minYear, startYear);
          maxYear = Math.max(maxYear, currentYear);
        } else if (when.includes("-")) {
          // Handle "2014 - 2016" format
          const years = when.match(/(\d{4})/g);
          if (years && years.length >= 2) {
            const startYear = parseInt(years[0]);
            const endYear = parseInt(years[1]);
            minYear = Math.min(minYear, startYear);
            maxYear = Math.max(maxYear, endYear);
          }
        }
      }

      // Calculate total years from earliest start to latest end
      const totalYears = maxYear - minYear;
      return totalYears;
    } catch (error) {
      console.warn("Error calculating years of experience:", error);
      throw error;
    }
  }

  /**
   * Get portfolio statistics (fun facts only)
   */
  getStats() {
    try {
      const { funFacts } = this.data.personal;
      const yearsExperience = this.calculateYearsOfExperience();
      return funFacts(yearsExperience);
    } catch (error) {
      return { error: "Statistics not available" };
    }
  }

  /**
   * Get portfolio summary (bio/summary only)
   */
  getSummary() {
    try {
      const { personalInfo } = this.data.personal;
      const yearsExperience = this.calculateYearsOfExperience();
      return personalInfo(yearsExperience);
    } catch (error) {
      return { error: "Summary not available" };
    }
  }

  /**
   * Get additional professional information (certifications, industries, APIs, cloud experience)
   */
  getAdditionalInfo() {
    try {
      const { services } = this.data.services;
      const cloudService = getServiceByName(services, "Cloud");
      const toolsService = getServiceByName(services, "Other Tools");
      const otherSkillsService = getServiceByName(services, "Other Skills");

      return {
        certifications: [],
        industries: [],
        cloudPlatforms: cloneArray(cloudService?.types),
        APIs: cloneArray(otherSkillsService?.types).filter((item) =>
          /api|graphql|rest/i.test(item),
        ),
        developmentTools: cloneArray(toolsService?.types),
      };
    } catch (error) {
      return {
        certifications: [],
        industries: [],
        cloudPlatforms: [],
        APIs: [],
        developmentTools: [],
      };
    }
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
