"use strict";

const path = require("node:path");

function createPaths(app) {
  const userData = app.getPath("userData");
  const dataRoot = path.join(userData, "omnilink-data");
  return {
    userData,
    dataRoot,
    configFile: path.join(dataRoot, "config.json"),
    runtimeStateFile: path.join(dataRoot, "state", "runtime-state.json"),
    runtimeLogFile: path.join(dataRoot, "logs", "runtime.log"),
    supervisorLogFile: path.join(dataRoot, "logs", "supervisor.log"),
    conversationFile: path.join(dataRoot, "conversation", "conversation.jsonl"),
  };
}

module.exports = { createPaths };
