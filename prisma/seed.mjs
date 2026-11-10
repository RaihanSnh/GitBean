import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const baseRecipe = { title: "Hario Switch - washed Ethiopia", bean_origin: "Yirgacheffe, Ethiopia", roast_level: "Light", brew_method: "V60", grind_size_microns: 650, water_temp_celsius: 93, coffee_grams: 15, water_grams: 250, ratio: "1:16.7", pour_steps: [{ step: 1, water_g: 45, time_s: 45, note: "Bloom" }, { step: 2, water_g: 125, time_s: 75, note: "Center pour" }, { step: 3, water_g: 250, time_s: 120, note: "Finish" }], author_alias: "maya.brews", commit_message: "Baseline recipe: floral, tea-like cup", version_tag: "v1.0" };
try {
  if (!await prisma.recipe.count()) {
    const base = await prisma.recipe.create({ data: baseRecipe });
    await prisma.recipe.create({ data: { ...baseRecipe, title: "AeroPress morning ritual", bean_origin: "Huila, Colombia", roast_level: "Medium-Light", brew_method: "Aeropress", grind_size_microns: 500, water_temp_celsius: 88, coffee_grams: 17, water_grams: 220, ratio: "1:12.9", pour_steps: [{ step: 1, water_g: 220, time_s: 30, note: "Pour and stir" }, { step: 2, water_g: 220, time_s: 90, note: "Press gently" }], author_alias: "roastmode", commit_message: "First version: sweet, full-bodied daily cup" } });
    await prisma.recipe.create({ data: { ...baseRecipe, title: "Bright & juicy - Guji dial-in", bean_origin: "Guji, Ethiopia", water_temp_celsius: 94, water_grams: 240, ratio: "1:16.0", author_alias: "beanthere", commit_message: "Tweak #2: raised temp to bring out citrus", version_tag: "v1.1", parent_recipe_id: base.id } });
    console.log("Seeded GitBean with three recipes.");
  } else console.log("Recipes already exist; seed skipped.");
} finally { await prisma.$disconnect(); }
