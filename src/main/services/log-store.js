"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

class LogStore {
  constructor(paths) {
    this.paths = paths;
  }

  async ensure() {
    await Promise.all([
      fs.mkdir(path.dirname(this.paths.runtimeLogFile), { recursive: true }),
      fs.mkdir(path.dirname(this.paths.supervisorLogFile), { recursive: true }),
    ]);
  }

  async appendRuntime(line) {
    await this.ensure();
    await fs.appendFile(this.paths.runtimeLogFile, `${line}\n`, "utf8");
  }

  async appendSupervisor(line) {
    await this.ensure();
    await fs.appendFile(this.paths.supervisorLogFile, `${line}\n`, "utf8");
  }

  async readTail(filePath, maxLines = 200) {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const rows = raw.split(/\r?\n/).filter(Boolean);
      return rows.slice(-maxLines).join("\n");
    } catch {
      return "";
    }
  }
}

module.exports = { LogStore };
