import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function generateLLMResponse(prompt) {
  if (!prompt) {
    console.error("❌ Prompt is empty. Cannot send request.");
    return "Error: prompt is empty.";
  }

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    // Safely extract text from Gemini response
    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      console.warn("⚠️ Gemini returned no text:", response.data);
      return "⚠️ Gemini returned no text";
    }

    console.log("🔹 Gemini raw response:", response.data);
    return text;
  } catch (error) {
    console.error(
      "❌ Gemini API error:",
      error.response?.data || error.message
    );
    return `Error fetching answer from Gemini: ${
      error.response?.data?.error?.message || error.message
    }`;
  }
}
