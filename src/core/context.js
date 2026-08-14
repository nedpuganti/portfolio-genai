const DATA_MODULES = {
  "education-data.js": require("../data/education-data"),
  "experience-data.js": require("../data/experience-data"),
  "personal-data.js": require("../data/personal-data"),
  "projects-data.js": require("../data/projects-data"),
  "services-data.js": require("../data/services-data"),
  "skills-data.js": require("../data/skills-data"),
};

let cachedContext = {
  full: "",
  files: {},
};

function formatContextBlock(file, content) {
  return `FILE: ${file}\n${content}\n-----------------------\n`;
}

function buildContext() {
  const fileContents = {};
  let fullContext = "";

  for (const [file, data] of Object.entries(DATA_MODULES)) {
    const content = JSON.stringify(data, null, 2);
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
