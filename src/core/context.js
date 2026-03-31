const fs = require("fs");
const path = require("path");

let cachedContext = "";

function buildContext() {
  const dir = path.join(__dirname, "../mocks");

  // Check if the mocks directory exists
  if (!fs.existsSync(dir)) {
    console.log("Mocks directory not found, initializing empty context");
    return "";
  }

  const files = fs.readdirSync(dir);
  let context = "";

  for (const file of files) {
    if (
      !file.endsWith(".json") &&
      !file.endsWith(".md") &&
      !file.endsWith(".js")
    )
      continue;

    const content = fs.readFileSync(path.join(dir, file), "utf-8");

    context += `
FILE: ${file}
${content}
-----------------------
`;
  }

  return context;
}

function initContext() {
  cachedContext = buildContext();
  console.log("Context loaded");
}

function getContext() {
  return cachedContext;
}

module.exports = { initContext, getContext };
