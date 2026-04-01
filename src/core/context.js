const fs = require("fs");
const path = require("path");

let cachedContext = {
  full: "",
  files: {},
};

function formatContextBlock(file, content) {
  return `FILE: ${file}\n${content}\n-----------------------\n`;
}

function buildContext() {
  const dir = path.join(__dirname, "../data");

  // Check if the data directory exists
  if (!fs.existsSync(dir)) {
    console.log("Data directory not found, initializing empty context");
    return { full: "", files: {} };
  }

  const files = fs.readdirSync(dir);
  const fileContents = {};
  let fullContext = "";

  for (const file of files) {
    if (
      !file.endsWith(".json") &&
      !file.endsWith(".md") &&
      !file.endsWith(".js")
    )
      continue;

    const content = fs.readFileSync(path.join(dir, file), "utf-8");
    fileContents[file] = content;

    fullContext += formatContextBlock(file, content);
  }

  return {
    full: fullContext,
    files: fileContents,
  };
}

function initContext() {
  cachedContext = buildContext();
  console.log("Context loaded");
}

function getContext(options = {}) {
  if (!cachedContext.full) {
    cachedContext = buildContext();
  }

  const { files } = options;
  if (!Array.isArray(files) || files.length === 0) {
    return cachedContext.full;
  }

  return files
    .filter((file) => cachedContext.files[file])
    .map((file) => formatContextBlock(file, cachedContext.files[file]))
    .join("");
}

module.exports = { initContext, getContext };
