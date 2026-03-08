"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_CONFIG = Object.freeze({
  appId: "",
  appSecret: "",
  chatId: "",
  codexCommand: "codex",
  codexWorkdir: "",
  autoStartOnLogin: false,
});

function normalizeConfig(input) {
  const next = { ...DEFAULT_CONFIG, ...(input || {}) };
  return {
    appId: String(next.appId || "").trim(),
    appSecret: String(next.appSecret || "").trim(),
    chatId: String(next.chatId || "").trim(),
    codexCommand: String(next.codexCommand || "codex").trim() || "codex",
    codexWorkdir: String(next.codexWorkdir || "").trim(),
    autoStartOnLogin: Boolean(next.autoStartOnLogin),
  };
}

class ConfigStore {
  constructor(paths) {
    this.paths = paths;
  }

  async load() {
    try {
      const raw = await fs.readFile(this.paths.configFile, "utf8");
      return normalizeConfig(JSON.parse(raw));
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  async save(input) {
    const config = normalizeConfig(input);
    await fs.mkdir(path.dirname(this.paths.configFile), { recursive: true });
    await fs.writeFile(this.paths.configFile, JSON.stringify(config, null, 2), "utf8");
    return config;
  }

  validate(config) {
    const value = normalizeConfig(config);
    const missing = [];
    if (!value.appId) missing.push("appId");
    if (!value.appSecret) missing.push("appSecret");
    if (!value.chatId) missing.push("chatId");
    return {
      ok: missing.length === 0,
      missing,
      config: value,
    };
  }
}

module.exports = { ConfigStore, DEFAULT_CONFIG, normalizeConfig };
