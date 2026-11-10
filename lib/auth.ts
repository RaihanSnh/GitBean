import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE = "gitbean_session";
const SESSION_SECONDS = 60 * 60 * 24 * 14;
function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be configured in production.");
  return value || "local-development-secret-change-before-deploying";
}
function sign(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }
export function makeSession(userId: string) {
  const payload = Buffer.from(`${userId}.${Math.floor(Date.now() / 1000) + SESSION_SECONDS}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function verifySession(token?: string) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload)); const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const [userId, expiry] = decoded.split(".");
    if (!userId || !expiry || Number(expiry) <= Date.now() / 1000) return null;
    return userId;
  } catch { return null; }
}
export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  const userId = verifySession(token);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, email: true } });
}
export async function startSession(userId: string) {
  (await cookies()).set(COOKIE, makeSession(userId), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: SESSION_SECONDS,
  });
}
export async function endSession() { (await cookies()).delete(COOKIE); }
