import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCached, invalidateRecipeCache, setCached } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cached = await getCached<unknown[]>("recipes:all");
    if (cached) return NextResponse.json(cached);
    const recipes = await prisma.recipe.findMany({
      include: { parent_recipe: { select: { id: true, title: true, author_alias: true, commit_message: true, created_at: true } }, _count: { select: { forks: true } } },
      orderBy: { created_at: "desc" }, take: 100,
    });
    await setCached("recipes:all", recipes);
    return NextResponse.json(recipes);
  } catch (error) {
    console.error("Recipe list failed", error);
    return NextResponse.json({ error: "Recipe storage is unavailable. Start the database and run migrations." }, { status: 503 });
  }
}

const methods = ["V60", "Aeropress", "Kalita Wave", "Clever Dripper"];
const roasts = ["Light", "Medium-Light", "Medium", "Dark"];
function validRecipe(body: Record<string, unknown>) {
  const textFields = ["title", "bean_origin", "roast_level", "brew_method", "author_alias", "commit_message"];
  if (textFields.some((field) => typeof body[field] !== "string" || !(body[field] as string).trim())) return "Fill in all text fields, including the commit message.";
  if (!methods.includes(body.brew_method as string)) return "Choose a supported brew method.";
  if (!roasts.includes(body.roast_level as string)) return "Choose a supported roast level.";
  for (const field of ["grind_size_microns", "water_temp_celsius", "coffee_grams", "water_grams"]) {
    if (typeof body[field] !== "number" || !Number.isFinite(body[field]) || (body[field] as number) <= 0) return `Enter a valid ${field.replaceAll("_", " ")}.`;
  }
  if (!Array.isArray(body.pour_steps) || body.pour_steps.length < 1 || body.pour_steps.length > 12) return "Add between 1 and 12 pour steps.";
  if (body.pour_steps.some((step) => !step || typeof step !== "object" || !Number.isFinite((step as Record<string, number>).water_g) || !Number.isFinite((step as Record<string, number>).time_s))) return "Each pour step needs water and time values.";
  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const message = validRecipe(body);
    if (message) return NextResponse.json({ error: message }, { status: 400 });
    const parentId = typeof body.parent_recipe_id === "string" ? body.parent_recipe_id : null;
    if (parentId && !await prisma.recipe.findUnique({ where: { id: parentId }, select: { id: true } })) {
      return NextResponse.json({ error: "The source recipe no longer exists." }, { status: 404 });
    }
    const recipe = await prisma.recipe.create({ data: {
      title: (body.title as string).trim(), bean_origin: (body.bean_origin as string).trim(), roast_level: body.roast_level as string,
      brew_method: body.brew_method as string, grind_size_microns: body.grind_size_microns as number,
      water_temp_celsius: body.water_temp_celsius as number, coffee_grams: body.coffee_grams as number,
      water_grams: body.water_grams as number, ratio: `1:${((body.water_grams as number) / (body.coffee_grams as number)).toFixed(1)}`,
      pour_steps: body.pour_steps as object[], author_alias: (body.author_alias as string).trim().replace(/^@/, ""),
      commit_message: (body.commit_message as string).trim(), parent_recipe_id: parentId,
      version_tag: parentId ? "v1.1" : "v1.0",
    } });
    await invalidateRecipeCache();
    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error("Recipe creation failed", error);
    return NextResponse.json({ error: "Could not save recipe. Check database connectivity and try again." }, { status: 503 });
  }
}
