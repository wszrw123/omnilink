"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { fork } = require("node:child_process");
const { randomUUID } = require("node:crypto");

class RuntimeManager {
  constructor({ paths, logStore, configStore }) {
    this.paths = paths;
    this.logStore = logStore;
    this.configStore = configStore;
    this.child = null;
    this.state = {
      running: false,
      pid: null,
      startedAt: "",
      lastExitCode: null,
      lastError: "",
      mode: "mock",
    };
  }

  async loadState() {
    try {
      const raw = await fs.readFile(this.paths.runtimeStateFile, "utf8");
      this.state = { ...this.state, ...JSON.parse(raw) };
    } catch {
      await this.persistState();
    }
    return this.getStatus();
  }

  async persistState() {
    await fs.mkdir(path.dirname(this.paths.runtimeStateFile), { recursive: true });
    await fs.writeFile(this.paths.runtimeStateFile, JSON.stringify(this.state, null, 2), "utf8");
  }

  getStatus() {
    return {
      ...this.state,
      runtimeLogFile: this.paths.runtimeLogFile,
      supervisorLogFile: this.paths.supervisorLogFile,
      conversationFile: this.paths.conversationFile,
    };
  }

  async start(config) {
    const validation = this.configStore.validate(config);
    if (!validation.ok) {
      this.state.running = false;
      this.state.lastError = `Missing required fields: ${validation.missing.join(", ")}`;
      await this.logStore.appendSupervisor(`[supervisor] start blocked ${this.state.lastError}`);
      await this.persistState();
      return this.getStatus();
    }
    if (this.child && !this.child.killed) {
      return this.getStatus();
    }

    await this.logStore.appendSupervisor("[supervisor] starting mock relay worker");
    const child = fork(path.join(__dirname, "../../runtime/mock-relay.js"), [], {
      stdio: ["ignore", "ignore", "ignore", "ipc"],
      env: {
        ...process.env,
        RELAY_APP_ID: validation.config.appId,
        RELAY_APP_SECRET: validation.config.appSecret,
        RELAY_CHAT_ID: validation.config.chatId,
        RELAY_RUNTIME_LOG: this.paths.runtimeLogFile,
        RELAY_CONVERSATION_FILE: this.paths.conversationFile,
      },
    });
    this.child = child;
    this.state = {
      ...this.state,
      running: true,
      pid: child.pid || null,
      startedAt: new Date().toISOString(),
      lastExitCode: null,
      lastError: "",
    };
    await this.persistState();

    child.on("message", async (message) => {
      if (!message || typeof message !== "object") return;
      if (message.type === "heartbeat") {
        await this.logStore.appendSupervisor(`[supervisor] worker heartbeat pid=${child.pid || 0}`);
      }
    });

    child.on("exit", async (code) => {
      this.child = null;
      this.state.running = false;
      this.state.pid = null;
      this.state.lastExitCode = code;
      await this.logStore.appendSupervisor(`[supervisor] worker exited code=${code}`);
      await this.persistState();
    });

    return this.getStatus();
  }

  async stop() {
    if (this.child && !this.child.killed) {
      await this.logStore.appendSupervisor("[supervisor] stopping mock relay worker");
      this.child.kill();
    }
    this.child = null;
    this.state.running = false;
    this.state.pid = null;
    await this.persistState();
    return this.getStatus();
  }

  async restart(config) {
    await this.stop();
    return this.start(config);
  }

  async sendMessage(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) {
      throw new Error("Message cannot be empty.");
    }
    if (!this.child || this.child.killed) {
      throw new Error("Relay is not running.");
    }
    const traceId = randomUUID().slice(0, 8);
    this.child.send({ type: "sendMessage", traceId, text: trimmed });
    return { traceId };
  }

  async shutdown() {
    await this.stop();
  }
}

module.exports = { RuntimeManager };
