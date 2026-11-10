import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { currentUser, endSession, startSession } from "@/lib/auth";

export const runtime = "nodejs";
const scrypt = promisify(scryptCallback);
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const result = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${result.toString("hex")}`;
}
async function passwordMatches(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = await scrypt(password, salt, expected.length) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function responseError(message: string, status: number) { return NextResponse.json({ error: message }, { status }); }

export async function GET() {
  try { return NextResponse.json({ user: await currentUser() }); }
  catch (error) { console.error("Session lookup failed", error); return responseError("Could not check the session.", 503); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = body.action;
    if (action === "logout") { await endSession(); return NextResponse.json({ user: null }); }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 10 || password.length > 200) return responseError("Enter a valid email and a password of at least 10 characters.", 400);
    if (action === "register") {
      const username = typeof body.username === "string" ? body.username.trim().replace(/^@/, "") : "";
      if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(username)) return responseError("Username must be 3–24 characters using letters, numbers, dots, dashes, or underscores.", 400);
      const user = await prisma.user.create({ data: { email, username, password_hash: await hashPassword(password) }, select: { id: true, username: true, email: true } });
      await startSession(user.id);
      return NextResponse.json({ user }, { status: 201 });
    }
    if (action === "login") {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !await passwordMatches(password, user.password_hash)) return responseError("Email or password is incorrect.", 401);
      await startSession(user.id);
      return NextResponse.json({ user: { id: user.id, username: user.username, email: user.email } });
    }
    return responseError("Unknown authentication action.", 400);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return responseError("That email or username is already registered.", 409);
    console.error("Authentication failed", error);
    return responseError("Could not complete authentication. Check database connectivity.", 503);
  }
}
