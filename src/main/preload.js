"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("relayApi", {
  getAppInfo: () => ipcRenderer.invoke("app:getInfo"),
  getConfig: () => ipcRenderer.invoke("config:get"),
  saveConfig: (payload) => ipcRenderer.invoke("config:save", payload),
  getRuntimeStatus: () => ipcRenderer.invoke("runtime:getStatus"),
  startRelay: () => ipcRenderer.invoke("runtime:start"),
  stopRelay: () => ipcRenderer.invoke("runtime:stop"),
  restartRelay: () => ipcRenderer.invoke("runtime:restart"),
  getLogs: (kind, maxLines) => ipcRenderer.invoke("logs:get", { kind, maxLines }),
  getConversation: (limit) => ipcRenderer.invoke("conversation:list", { limit }),
  sendConversationMessage: (text) => ipcRenderer.invoke("conversation:send", { text }),
  openDataDirectory: () => ipcRenderer.invoke("shell:openDataDirectory"),
});
