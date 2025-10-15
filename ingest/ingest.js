// ingest/ingest.js
// install first: npm i rss-parser axios uuid dotenv

import Parser from "rss-parser";
import dotenv from "dotenv";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const parser = new Parser();
const JINA_API_KEY = process.env.JINA_API_KEY;
const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const COLLECTION = "news_articles";
const JINA_MODEL = "jina-embeddings-v3";

// ✅ safer fetch with error handling
async function fetchArticles(rssUrl, limit = 30) {
  try {
    const feed = await parser.parseURL(rssUrl);
    return (feed.items || []).slice(0, limit);
  } catch (err) {
    console.error(`❌ Failed to fetch ${rssUrl}:`, err.message);
    return [];
  }
}

// ✅ chunk text into smaller pieces for embeddings
function chunkText(text, chunkSize = 800) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize).trim();
    if (chunk) chunks.push(chunk); // skip empty
  }
  return chunks;
}

// ✅ call Jina Embeddings API
async function embedTexts(texts) {
  const res = await axios.post(
    "https://api.jina.ai/v1/embeddings",
    {
      model: JINA_MODEL,
      input: texts,
    },
    {
      headers: {
        Authorization: `Bearer ${JINA_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  return res.data.embeddings; // array of vectors
}

// ✅ insert into Qdrant
async function upsertToQdrant(points) {
  try {
    // ensure collection exists
    await axios.put(`${QDRANT_URL}/collections/${COLLECTION}`, {
      vectors: { size: points[0].vector.length, distance: "Cosine" },
    }).catch(() => { /* ignore if already exists */ });

    await axios.put(
      `${QDRANT_URL}/collections/${COLLECTION}/points?wait=true`,
      { points }
    );
  } catch (err) {
    console.error("❌ Upsert to Qdrant failed:", err.message);
  }
}

(async () => {
  const rssList = [
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://feeds.reuters.com/reuters/topNews",
    "https://www.aljazeera.com/xml/rss/all.xml",
    "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
  ];

  const limitPerFeed = 20;
  const allChunks = [];

  for (const url of rssList) {
    console.log(`🔎 Fetching: ${url}`);
    const items = await fetchArticles(url, limitPerFeed);

    for (const it of items) {
      const text =
        it.contentSnippet || it.content || it.summary || it.title || "";

      if (!text || text.trim() === "") {
        console.log(`⚠️ Skipping empty article: ${it.title}`);
        continue;
      }

      const chunks = chunkText(text, 900);

      for (const c of chunks) {
        allChunks.push({
          id: uuidv4(),
          payload: { title: it.title, link: it.link, source: url, text: c },
          text: c,
        });
      }
    }
  }

  console.log(`✅ Collected ${allChunks.length} text chunks`);

  // embed + upsert in batches
  const batchSize = 50;
  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const texts = batch.map((b) => b.text);

    try {
      const embeddings = await embedTexts(texts);

      const points = batch.map((b, idx) => ({
        id: b.id,
        payload: b.payload,
        vector: embeddings[idx],
      }));

      await upsertToQdrant(points);
      console.log(`✅ Upserted ${points.length} points`);
    } catch (err) {
      console.error("❌ Embedding/Upsert failed:", err.message);
      console.log("Affected texts:", texts);
    }
  }

  console.log("🎉 Ingestion finished.");
})();
