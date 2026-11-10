CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bean_origin" TEXT NOT NULL,
    "roast_level" TEXT NOT NULL,
    "brew_method" TEXT NOT NULL,
    "grind_size_microns" INTEGER NOT NULL,
    "water_temp_celsius" INTEGER NOT NULL,
    "coffee_grams" DOUBLE PRECISION NOT NULL,
    "water_grams" DOUBLE PRECISION NOT NULL,
    "ratio" TEXT NOT NULL,
    "pour_steps" JSONB NOT NULL,
    "author_alias" TEXT NOT NULL,
    "commit_message" TEXT NOT NULL,
    "version_tag" TEXT NOT NULL DEFAULT 'v1.0',
    "parent_recipe_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Recipe_parent_recipe_id_idx" ON "Recipe"("parent_recipe_id");
CREATE INDEX "Recipe_created_at_idx" ON "Recipe"("created_at");
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_parent_recipe_id_fkey" FOREIGN KEY ("parent_recipe_id") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
