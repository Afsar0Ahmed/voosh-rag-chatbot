import axios from "axios";

const API_BASE = "http://localhost:4000/api"; // Backend URL

export const sendChat = async (sessionId, prompt) => {
  const res = await axios.post(`${API_BASE}/chat`, { sessionId, prompt });
  return res.data;
};

export const getHistory = async (sessionId) => {
  const res = await axios.get(`${API_BASE}/history/${sessionId}`);
  return res.data;
};

export const deleteHistory = async (sessionId) => {
  const res = await axios.delete(`${API_BASE}/history/${sessionId}`);
  return res.data;
};
