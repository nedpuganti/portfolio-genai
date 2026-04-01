const test = require("node:test");
const assert = require("node:assert/strict");

const { PortfolioTools } = require("../../src/core/tools");

test("portfolio tools filter services by extracted search terms", () => {
  const tools = new PortfolioTools();

  const services = tools.getServices({ searchTerms: ["kubernetes"] });

  assert.equal(Array.isArray(services), true);
  assert.equal(services.length, 1);
  assert.equal(services[0].name, "DevOps");
});

test("portfolio tools filter projects by search terms when matches exist", () => {
  const tools = new PortfolioTools();

  const projects = tools.getProjects({ searchTerms: ["genai"] });

  assert.equal(Array.isArray(projects), true);
  assert.equal(projects.length, 1);
  assert.equal(projects[0].title, "Portfolio GenAI Chatbot");
});

test("additional info is derived from provided portfolio data only", () => {
  const tools = new PortfolioTools();

  const additionalInfo = tools.getAdditionalInfo();

  assert.deepEqual(additionalInfo.certifications, []);
  assert.deepEqual(additionalInfo.industries, []);
  assert.deepEqual(additionalInfo.cloudPlatforms, [
    "AWS (S3, SNS, SQS, SES, etc.)",
    "GCP",
  ]);
  assert.deepEqual(additionalInfo.APIs, ["Ajax / RestApi / Graphql"]);
  assert.equal(additionalInfo.developmentTools.includes("Grafana (Analytics)"), true);
  assert.equal(additionalInfo.cloudPlatforms.includes("Microsoft Azure"), false);
});

test("education highlights expose the highest qualification from provided data", () => {
  const tools = new PortfolioTools();

  const educationHighlights = tools.getEducationHighlights();

  assert.equal(educationHighlights.highestEducation.name, "Master of Computer Science");
  assert.deepEqual(educationHighlights.certifications, []);
});

test("project highlights expose the latest dated project from provided data", () => {
  const tools = new PortfolioTools();

  const projectHighlights = tools.getProjectHighlights();

  assert.equal(projectHighlights.latestProject.title, "Portfolio GenAI Chatbot");
  assert.equal(projectHighlights.latestProject.date, "2026");
});
