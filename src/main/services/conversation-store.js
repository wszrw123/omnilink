"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

class ConversationStore {
  constructor(paths) {
    this.paths = paths;
  }

  async append(entry) {
    const payload = {
      at: new Date().toISOString(),
      role: String(entry.role || "assistant"),
      text: String(entry.text || "").trim(),
      source: String(entry.source || "mock_relay"),
      status: String(entry.status || "ok"),
      traceId: String(entry.traceId || ""),
    };
    if (!payload.text) return null;
    await fs.mkdir(path.dirname(this.paths.conversationFile), { recursive: true });
    await fs.appendFile(this.paths.conversationFile, `${JSON.stringify(payload)}\n`, "utf8");
    return payload;
  }

  async list(limit = 120) {
    try {
      const raw = await fs.readFile(this.paths.conversationFile, "utf8");
      const rows = raw.split(/\r?\n/).filter(Boolean);
      const parsed = rows.slice(-limit).flatMap((line) => {
        try {
          return [JSON.parse(line)];
        } catch {
          return [];
        }
      });
      return parsed;
    } catch {
      return [];
    }
  }
}

module.exports = { ConversationStore };
