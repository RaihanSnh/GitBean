import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/auth";
import { invalidateRecipeCache } from "@/lib/cache";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Sign in to save recipes." }, { status: 401 });
    const { id } = await context.params;
    const body = await request.json() as { recipe_id?: unknown };
    if (typeof body.recipe_id !== "string") return NextResponse.json({ error: "Choose a recipe." }, { status: 400 });
    const collection = await prisma.collection.findFirst({ where: { id, user_id: user.id }, select: { id: true } });
    if (!collection) return NextResponse.json({ error: "Collection not found." }, { status: 404 });
    await prisma.recipeCollection.upsert({ where: { collection_id_recipe_id: { collection_id: id, recipe_id: body.recipe_id } }, create: { collection_id: id, recipe_id: body.recipe_id }, update: {} });
    await invalidateRecipeCache();
    return NextResponse.json({ saved: true });
  } catch { return NextResponse.json({ error: "Could not save this recipe to the collection." }, { status: 503 }); }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Sign in to edit collections." }, { status: 401 });
    const { id } = await context.params;
    const body = await request.json() as { recipe_id?: unknown };
    if (typeof body.recipe_id !== "string") return NextResponse.json({ error: "Choose a recipe." }, { status: 400 });
    const collection = await prisma.collection.findFirst({ where: { id, user_id: user.id }, select: { id: true } });
    if (!collection) return NextResponse.json({ error: "Collection not found." }, { status: 404 });
    await prisma.recipeCollection.deleteMany({ where: { collection_id: id, recipe_id: body.recipe_id } });
    return NextResponse.json({ saved: false });
  } catch { return NextResponse.json({ error: "Could not remove this recipe." }, { status: 503 }); }
}
