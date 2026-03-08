"use strict";

const path = require("node:path");
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { createPaths } = require("./services/paths");
const { ConfigStore } = require("./services/config-store");
const { LogStore } = require("./services/log-store");
const { ConversationStore } = require("./services/conversation-store");
const { RuntimeManager } = require("./services/runtime-manager");

let mainWindow = null;
let paths;
let configStore;
let logStore;
let conversationStore;
let runtimeManager;

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#dfe8f8",
    title: "Omnilink",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  await mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
}

async function registerHandlers() {
  ipcMain.handle("app:getInfo", async () => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    userData: paths.userData,
    dataRoot: paths.dataRoot,
  }));

  ipcMain.handle("config:get", async () => {
    return configStore.load();
  });

  ipcMain.handle("config:save", async (_event, payload) => {
    const config = await configStore.save(payload || {});
    app.setLoginItemSettings({ openAtLogin: Boolean(config.autoStartOnLogin) });
    await logStore.appendSupervisor(`[supervisor] config saved autoStartOnLogin=${config.autoStartOnLogin}`);
    return {
      config,
      validation: configStore.validate(config),
    };
  });

  ipcMain.handle("runtime:getStatus", async () => runtimeManager.getStatus());
  ipcMain.handle("runtime:start", async () => runtimeManager.start(await configStore.load()));
  ipcMain.handle("runtime:stop", async () => runtimeManager.stop());
  ipcMain.handle("runtime:restart", async () => runtimeManager.restart(await configStore.load()));

  ipcMain.handle("logs:get", async (_event, payload) => {
    const maxLines = Number.isFinite(Number(payload?.maxLines)) ? Number(payload.maxLines) : 200;
    const kind = payload?.kind === "supervisor" ? "supervisor" : "runtime";
    const filePath = kind === "supervisor" ? paths.supervisorLogFile : paths.runtimeLogFile;
    return {
      kind,
      filePath,
      text: await logStore.readTail(filePath, maxLines),
    };
  });

  ipcMain.handle("conversation:list", async (_event, payload) => {
    const limit = Number.isFinite(Number(payload?.limit)) ? Number(payload.limit) : 120;
    return conversationStore.list(limit);
  });

  ipcMain.handle("conversation:send", async (_event, payload) => {
    return runtimeManager.sendMessage(payload?.text || "");
  });

  ipcMain.handle("shell:openDataDirectory", async () => {
    const result = await shell.openPath(paths.dataRoot);
    return { ok: !result, error: result || "" };
  });
}

app.whenReady().then(async () => {
  paths = createPaths(app);
  configStore = new ConfigStore(paths);
  logStore = new LogStore(paths);
  conversationStore = new ConversationStore(paths);
  runtimeManager = new RuntimeManager({ paths, logStore, configStore });
  await runtimeManager.loadState();
  await registerHandlers();
  await createMainWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  if (runtimeManager) {
    await runtimeManager.shutdown();
  }
});
