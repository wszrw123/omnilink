"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const runtimeLogFile = process.env.RELAY_RUNTIME_LOG;
const conversationFile = process.env.RELAY_CONVERSATION_FILE;
const relayChatId = process.env.RELAY_CHAT_ID || "";

async function ensureParent(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function appendRuntime(line) {
  const row = `${new Date().toISOString()} ${line}`;
  await ensureParent(runtimeLogFile);
  await fs.appendFile(runtimeLogFile, `${row}\n`, "utf8");
}

async function appendConversation(entry) {
  await ensureParent(conversationFile);
  await fs.appendFile(conversationFile, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`, "utf8");
}

async function bootstrap() {
  await appendRuntime(`[runtime] mock relay started chat_id=${relayChatId || "-"}`);
  process.send?.({ type: "heartbeat" });
}

async function handleMessage(message) {
  if (!message || message.type !== "sendMessage") return;
  const traceId = String(message.traceId || "-");
  const text = String(message.text || "").trim();
  await appendRuntime(`[runtime] inbound trace_id=${traceId} text=${text}`);
  await appendConversation({ traceId, role: "operator", source: "desktop_console", status: "sent", text });
  setTimeout(async () => {
    const reply = `Mock relay ack: ${text}`;
    await appendRuntime(`[runtime] outbound trace_id=${traceId} ok=true`);
    await appendConversation({ traceId, role: "assistant", source: "mock_relay", status: "ok", text: reply });
  }, 700);
}

process.on("message", (message) => {
  handleMessage(message).catch((error) => {
    appendRuntime(`[runtime] handler_error ${String(error)}`).catch(() => {});
  });
});

setInterval(() => {
  process.send?.({ type: "heartbeat" });
}, 15000).unref();

bootstrap().catch(async (error) => {
  await appendRuntime(`[runtime] startup_error ${String(error)}`);
  process.exit(1);
});
