"use strict";

const META = {
  overview: { eyebrow: "DESKTOP MVP", title: "总览", desc: "一个跨平台的桌面中继控制台，首版聚焦配置、运行控制、会话与日志。", refresh: refreshOverview },
  conversation: { eyebrow: "CONVERSATION", title: "会话", desc: "当前骨架用 mock relay 贯通消息流。后续替换成真实 worker。", refresh: refreshConversation },
  logs: { eyebrow: "LOGS", title: "日志", desc: "Runtime 和 Supervisor 拆开显示，方便判断运行态和控制态。", refresh: refreshLogs },
  settings: { eyebrow: "SETTINGS", title: "设置", desc: "当前仓库刻意保持边界简单，不做多 provider 抽象。", refresh: refreshConfig },
  about: { eyebrow: "ABOUT", title: "关于", desc: "公开版优先保证目录、接口和数据模型干净。", refresh: refreshAbout },
};

const state = {
  activeView: "overview",
  activeLogKind: "runtime",
  runtimeStatus: null,
  appInfo: null,
  config: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const els = {
  heroEyebrow: $("#heroEyebrow"),
  heroTitle: $("#heroTitle"),
  heroDesc: $("#heroDesc"),
  statusBadge: $("#statusBadge"),
  runtimeMode: $("#runtimeMode"),
  workerPid: $("#workerPid"),
  startedAt: $("#startedAt"),
  lastExitCode: $("#lastExitCode"),
  runtimeHint: $("#runtimeHint"),
  configForm: $("#configForm"),
  validationMessage: $("#validationMessage"),
  conversationFeed: $("#conversationFeed"),
  messageInput: $("#messageInput"),
  conversationHint: $("#conversationHint"),
  logOutput: $("#logOutput"),
  appName: $("#appName"),
  appVersion: $("#appVersion"),
  appPlatform: $("#appPlatform"),
  userDataPath: $("#userDataPath"),
  dataRootPath: $("#dataRootPath"),
  refreshBtn: $("#refreshBtn"),
  openDataDirBtn: $("#openDataDirBtn"),
  saveConfigBtn: $("#saveConfigBtn"),
  startBtn: $("#startBtn"),
  stopBtn: $("#stopBtn"),
  restartBtn: $("#restartBtn"),
  sendBtn: $("#sendBtn"),
};

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("zh-CN", { hour12: false });
}

function setHero(view) {
  const meta = META[view] || META.overview;
  els.heroEyebrow.textContent = meta.eyebrow;
  els.heroTitle.textContent = meta.title;
  els.heroDesc.textContent = meta.desc;
  els.refreshBtn.textContent = `刷新${meta.title}`;
}

function getConfigPayload() {
  const form = new FormData(els.configForm);
  return {
    appId: String(form.get("appId") || "").trim(),
    appSecret: String(form.get("appSecret") || "").trim(),
    chatId: String(form.get("chatId") || "").trim(),
    codexCommand: String(form.get("codexCommand") || "").trim(),
    codexWorkdir: String(form.get("codexWorkdir") || "").trim(),
    autoStartOnLogin: form.get("autoStartOnLogin") === "on",
  };
}

function fillConfig(config) {
  els.configForm.elements.appId.value = config.appId || "";
  els.configForm.elements.appSecret.value = config.appSecret || "";
  els.configForm.elements.chatId.value = config.chatId || "";
  els.configForm.elements.codexCommand.value = config.codexCommand || "codex";
  els.configForm.elements.codexWorkdir.value = config.codexWorkdir || "";
  els.configForm.elements.autoStartOnLogin.checked = Boolean(config.autoStartOnLogin);
}

function renderValidation(validation) {
  if (!validation) {
    els.validationMessage.textContent = "尚未校验配置。";
    return;
  }
  if (validation.ok) {
    els.validationMessage.textContent = "配置完整，可以启动 relay。";
    return;
  }
  els.validationMessage.textContent = `仍缺少必填项: ${validation.missing.join(", ")}`;
}

function renderRuntime(status) {
  state.runtimeStatus = status;
  const running = Boolean(status?.running);
  els.statusBadge.textContent = running ? "运行中" : "未启动";
  els.statusBadge.className = `pill ${running ? "running" : "idle"}`;
  els.runtimeMode.textContent = status?.mode || "mock";
  els.workerPid.textContent = status?.pid || "-";
  els.startedAt.textContent = formatDate(status?.startedAt);
  els.lastExitCode.textContent = status?.lastExitCode ?? "-";
  els.runtimeHint.textContent = status?.lastError || (running ? "Mock relay 正在运行。" : "启动前请先保存配置。");
  els.conversationHint.textContent = running ? "当前发送会进入 mock relay。" : "Relay 未启动时无法发送。";
}

function renderConversation(messages) {
  if (!messages.length) {
    els.conversationFeed.innerHTML = '<div class="message"><div class="message-meta"><span>系统</span><span>-</span></div><div>暂无消息记录。</div></div>';
    return;
  }
  els.conversationFeed.innerHTML = messages.map((message) => `
    <div class="message ${message.role === "operator" ? "operator" : "assistant"}">
      <div class="message-meta">
        <span>${message.role === "operator" ? "控制台" : "Relay"}</span>
        <span>${formatDate(message.at)}</span>
      </div>
      <div>${escapeHtml(message.text || "")}</div>
    </div>
  `).join("");
  els.conversationFeed.scrollTop = els.conversationFeed.scrollHeight;
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function refreshConfig() {
  const config = await window.relayApi.getConfig();
  state.config = config;
  fillConfig(config);
  renderValidation({
    ok: Boolean(config.appId && config.appSecret && config.chatId),
    missing: [
      !config.appId && "appId",
      !config.appSecret && "appSecret",
      !config.chatId && "chatId",
    ].filter(Boolean),
  });
}

async function refreshRuntime() {
  renderRuntime(await window.relayApi.getRuntimeStatus());
}

async function refreshOverview() {
  await Promise.all([refreshConfig(), refreshRuntime()]);
}

async function refreshConversation() {
  renderConversation(await window.relayApi.getConversation(120));
}

async function refreshLogs() {
  const data = await window.relayApi.getLogs(state.activeLogKind, 220);
  els.logOutput.textContent = data.text || "(empty)";
}

async function refreshAbout() {
  const info = await window.relayApi.getAppInfo();
  state.appInfo = info;
  els.appName.textContent = info.name;
  els.appVersion.textContent = info.version;
  els.appPlatform.textContent = info.platform;
  els.userDataPath.textContent = info.userData;
  els.dataRootPath.textContent = info.dataRoot;
}

async function refreshCurrentView() {
  await META[state.activeView].refresh();
}

function showView(view) {
  state.activeView = view;
  setHero(view);
  $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  $$(".view").forEach((panel) => panel.classList.toggle("active", panel.id === `view-${view}`));
  refreshCurrentView().catch((error) => {
    console.error(error);
  });
}

async function saveConfig() {
  const result = await window.relayApi.saveConfig(getConfigPayload());
  state.config = result.config;
  renderValidation(result.validation);
}

async function sendMessage() {
  const text = els.messageInput.value.trim();
  if (!text) return;
  await window.relayApi.sendConversationMessage(text);
  els.messageInput.value = "";
  await new Promise((resolve) => setTimeout(resolve, 800));
  await refreshConversation();
  await refreshLogs();
}

function bindEvents() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });
  $$(".log-tab").forEach((button) => {
    button.addEventListener("click", async () => {
      state.activeLogKind = button.dataset.logKind;
      $$(".log-tab").forEach((item) => item.classList.toggle("active", item === button));
      await refreshLogs();
    });
  });
  els.refreshBtn.addEventListener("click", () => refreshCurrentView());
  els.openDataDirBtn.addEventListener("click", () => window.relayApi.openDataDirectory());
  els.saveConfigBtn.addEventListener("click", () => saveConfig());
  els.startBtn.addEventListener("click", async () => { await window.relayApi.startRelay(); await refreshOverview(); await refreshLogs(); });
  els.stopBtn.addEventListener("click", async () => { await window.relayApi.stopRelay(); await refreshOverview(); await refreshLogs(); });
  els.restartBtn.addEventListener("click", async () => { await window.relayApi.restartRelay(); await refreshOverview(); await refreshLogs(); });
  els.sendBtn.addEventListener("click", () => sendMessage());
  els.messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage().catch((error) => console.error(error));
    }
  });
}

async function bootstrap() {
  bindEvents();
  setHero("overview");
  await Promise.all([refreshOverview(), refreshConversation(), refreshLogs(), refreshAbout()]);
  setInterval(async () => {
    await refreshRuntime();
    if (state.activeView === "conversation") await refreshConversation();
    if (state.activeView === "logs") await refreshLogs();
  }, 4000);
}

bootstrap().catch((error) => {
  console.error(error);
});
