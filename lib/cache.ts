import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | undefined;
let connecting: Promise<RedisClientType | null> | undefined;
async function redis() {
  if (!process.env.REDIS_URL) return null;
  if (client?.isOpen) return client;
  if (!connecting) {
    connecting = (async () => {
      try {
        const next = createClient({ url: process.env.REDIS_URL });
        next.on("error", () => undefined);
        await next.connect();
        client = next;
        return next;
      } catch { return null; }
    })();
  }
  const result = await connecting;
  connecting = undefined;
  return result;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const connection = await redis();
  if (!connection) return null;
  try { const value = await connection.get(key); return value ? JSON.parse(value) as T : null; }
  catch { return null; }
}

export async function setCached(key: string, value: unknown, ttlSeconds = 20) {
  const connection = await redis();
  if (!connection) return;
  try { await connection.set(key, JSON.stringify(value), { EX: ttlSeconds }); } catch { /* cache is optional */ }
}

export async function invalidateRecipeCache() {
  const connection = await redis();
  if (!connection) return;
  try { await connection.del("recipes:all"); } catch { /* cache is optional */ }
}
