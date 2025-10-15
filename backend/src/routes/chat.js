// src/routes/chat.js
import express from "express";
import { generateResponse, fetchHistory, deleteHistory } from "../services/chatService.js";

const router = express.Router();

// Chat route
router.post("/chat", async (req, res) => {
  const { sessionId, prompt } = req.body;

  if (!prompt) {
    return res.json({
      sessionId: sessionId || "unknown",
      answer: "Error: prompt is empty.",
    });
  }

  const answer = await generateResponse(sessionId, prompt);
  res.json({ sessionId: sessionId || "unknown", answer });
});

// Fetch history route
router.get("/history/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const history = await fetchHistory(sessionId);
  res.json({ sessionId, history });
});

// Delete history route
router.delete("/history/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  await deleteHistory(sessionId);
  res.json({ sessionId, message: "History deleted" });
});

export default router;
