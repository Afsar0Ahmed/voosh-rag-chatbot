import { generateLLMResponse } from "../config/geminiClient.js";
import { storeHistory, getHistory, removeHistory } from "../config/redisClient.js";

export async function generateResponse(sessionId, message) {
  // Store user message first
  await storeHistory(sessionId, { role: "user", text: message });

  // Generate bot response
  const reply = await generateLLMResponse(message);

  // Store bot response
  await storeHistory(sessionId, { role: "bot", text: reply });

  return reply;
}

export async function fetchHistory(sessionId) {
  return await getHistory(sessionId);
}

export async function deleteHistory(sessionId) {
  await removeHistory(sessionId);
}
