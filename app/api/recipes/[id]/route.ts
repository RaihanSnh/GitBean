import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const recipe = await prisma.recipe.findUnique({ where: { id }, include: {
      parent_recipe: { select: { id: true, title: true, author_alias: true, commit_message: true } },
      forks: { select: { id: true, title: true, author_alias: true, commit_message: true, version_tag: true, created_at: true }, orderBy: { created_at: "desc" } },
      _count: { select: { forks: true } },
    } });
    if (!recipe) return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
    return NextResponse.json(recipe);
  } catch { return NextResponse.json({ error: "Could not load this recipe." }, { status: 503 }); }
}
