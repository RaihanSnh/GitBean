import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";

export const runtime = "nodejs";
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Sign in to use collections." }, { status: 401 });
    const collections = await prisma.collection.findMany({ where: { user_id: user.id }, include: { recipes: { select: { recipe_id: true } }, _count: { select: { recipes: true } } }, orderBy: { name: "asc" } });
    return NextResponse.json(collections);
  } catch { return NextResponse.json({ error: "Could not load collections." }, { status: 503 }); }
}
export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Sign in to create a collection." }, { status: 401 });
    const body = await request.json() as { name?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 40) return NextResponse.json({ error: "Collection name must be 1–40 characters." }, { status: 400 });
    const collection = await prisma.collection.create({ data: { name, user_id: user.id }, include: { _count: { select: { recipes: true } } } });
    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ error: "You already have a collection with that name." }, { status: 409 });
    return NextResponse.json({ error: "Could not create collection." }, { status: 503 });
  }
}
