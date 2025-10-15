import { createClient } from "redis";

let client;

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const redisUsername = process.env.REDIS_USERNAME || "default";

// Function to create Redis client
function createRedisClient() {
  if (redisUrl) {
    // Use full URL (Upstash style)
    return createClient({
      url: redisUrl,
      password: redisPassword,
    });
  } else {
    // Standard host/port Redis
    return createClient({
      socket: { host: redisHost, port: redisPort },
      username: redisUsername,
      password: redisPassword,
    });
  }
}

client = createRedisClient();

// Event listeners
client.on("error", (err) => console.error("❌ Redis Client Error:", err));
client.on("connect", () => console.log("🔗 Redis connecting..."));
client.on("ready", () => console.log("✅ Redis is ready!"));
client.on("end", () => console.log("⚠️ Redis connection closed"));

// Connect with retries
async function connectRedis(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await client.connect();
      console.log("✅ Connected to Redis");
      return;
    } catch (err) {
      console.error(`❌ Redis connection failed (attempt ${i + 1}):`, err);
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
}

// Connect immediately
connectRedis().catch((err) => console.error("🚨 Could not connect to Redis:", err));

/** Helper functions **/
export async function storeHistory(sessionId, message) {
  const key = `chat:${sessionId}`;
  await client.rPush(key, JSON.stringify(message));
}

export async function getHistory(sessionId) {
  const key = `chat:${sessionId}`;
  const messages = await client.lRange(key, 0, -1);
  return messages.map((msg) => JSON.parse(msg));
}

export async function removeHistory(sessionId) {
  const key = `chat:${sessionId}`;
  await client.del(key);
}

export default client;
