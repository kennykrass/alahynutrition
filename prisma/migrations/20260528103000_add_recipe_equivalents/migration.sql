-- CreateTable
CREATE TABLE "FoodGroup" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prepMinutes" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeEquivalent" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "foodGroupId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RecipeEquivalent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodGroup_slug_key" ON "FoodGroup"("slug");

-- CreateIndex
CREATE INDEX "FoodGroup_isActive_sortOrder_idx" ON "FoodGroup"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Recipe_mealType_isActive_idx" ON "Recipe"("mealType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeEquivalent_recipeId_foodGroupId_key" ON "RecipeEquivalent"("recipeId", "foodGroupId");

-- CreateIndex
CREATE INDEX "RecipeEquivalent_foodGroupId_idx" ON "RecipeEquivalent"("foodGroupId");

-- AddForeignKey
ALTER TABLE "RecipeEquivalent" ADD CONSTRAINT "RecipeEquivalent_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeEquivalent" ADD CONSTRAINT "RecipeEquivalent_foodGroupId_fkey" FOREIGN KEY ("foodGroupId") REFERENCES "FoodGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed MVP food groups
INSERT INTO "FoodGroup" ("id", "slug", "name", "shortName", "icon", "sortOrder", "updatedAt")
VALUES
  ('fg_verduras', 'verduras', 'Verduras', 'Verduras', '🥬', 10, NOW()),
  ('fg_frutas', 'frutas', 'Frutas', 'Frutas', '🍎', 20, NOW()),
  ('fg_cereales', 'cereales', 'Cereales y tuberculos', 'Cereales', '🌾', 30, NOW()),
  ('fg_aoa', 'aoa', 'Alimentos de origen animal', 'AOA', '🥚', 40, NOW()),
  ('fg_leguminosas', 'leguminosas', 'Leguminosas', 'Leguminosas', '🫘', 50, NOW()),
  ('fg_grasas', 'grasas', 'Aceites y grasas', 'Grasas', '🥑', 60, NOW()),
  ('fg_azucares', 'azucares', 'Azucares', 'Azucares', '🍯', 70, NOW())
ON CONFLICT ("slug") DO NOTHING;

-- Seed MVP recipes
INSERT INTO "Recipe" ("id", "title", "mealType", "description", "prepMinutes", "imageUrl", "updatedAt")
VALUES
  ('recipe_huevo_espinacas', 'Revuelto de huevo con espinacas, jitomate y pan integral', 'BREAKFAST', 'Desayuno salado con verdura, cereal integral, AOA y grasa saludable.', 15, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80', NOW()),
  ('recipe_avena_platano', 'Avena con platano, nuez y huevo cocido', 'BREAKFAST', 'Opcion dulce de avena con fruta, grasa y proteina simple.', 12, 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=900&q=80', NOW()),
  ('recipe_chilaquiles_pollo', 'Chilaquiles verdes con pollo deshebrado y fruta', 'BREAKFAST', 'Version balanceada de chilaquiles con pollo y acompanamiento de fruta.', 20, 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=900&q=80', NOW()),
  ('recipe_quesadilla_nopales', 'Quesadilla de queso panela con nopales y fruta', 'BREAKFAST', 'Desayuno rapido con cereal, AOA, verdura y fruta.', 15, 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=900&q=80', NOW()),
  ('recipe_smoothie_tostada', 'Smoothie de frutos rojos con avena y tostada de aguacate', 'BREAKFAST', 'Combinacion fresca con fruta, cereal y grasa saludable.', 10, 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=900&q=80', NOW()),
  ('recipe_hotcakes_avena', 'Hotcakes de avena con platano y huevo a la mexicana', 'BREAKFAST', 'Plato completo para desayuno con fruta, cereal y AOA.', 18, 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=80', NOW()),
  ('recipe_bowl_pollo_arroz', 'Bowl de pollo con arroz, verduras y aguacate', 'LUNCH', 'Comida completa con cereal, proteina magra, verduras y grasa.', 25, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80', NOW()),
  ('recipe_tacos_frijol_pollo', 'Tacos de frijol con pollo, pico de gallo y aguacate', 'DINNER', 'Cena mexicana con leguminosa, AOA, cereal y verduras.', 20, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=900&q=80', NOW())
ON CONFLICT ("id") DO NOTHING;

-- Seed MVP recipe equivalents
INSERT INTO "RecipeEquivalent" ("id", "recipeId", "foodGroupId", "amount")
VALUES
  ('eq_huevo_verduras', 'recipe_huevo_espinacas', 'fg_verduras', 1),
  ('eq_huevo_frutas', 'recipe_huevo_espinacas', 'fg_frutas', 1),
  ('eq_huevo_cereales', 'recipe_huevo_espinacas', 'fg_cereales', 2),
  ('eq_huevo_aoa', 'recipe_huevo_espinacas', 'fg_aoa', 1),
  ('eq_huevo_grasas', 'recipe_huevo_espinacas', 'fg_grasas', 1),
  ('eq_avena_frutas', 'recipe_avena_platano', 'fg_frutas', 1),
  ('eq_avena_cereales', 'recipe_avena_platano', 'fg_cereales', 2),
  ('eq_avena_aoa', 'recipe_avena_platano', 'fg_aoa', 1),
  ('eq_avena_grasas', 'recipe_avena_platano', 'fg_grasas', 1),
  ('eq_chilaquiles_verduras', 'recipe_chilaquiles_pollo', 'fg_verduras', 1),
  ('eq_chilaquiles_frutas', 'recipe_chilaquiles_pollo', 'fg_frutas', 1),
  ('eq_chilaquiles_cereales', 'recipe_chilaquiles_pollo', 'fg_cereales', 2),
  ('eq_chilaquiles_aoa', 'recipe_chilaquiles_pollo', 'fg_aoa', 1),
  ('eq_chilaquiles_grasas', 'recipe_chilaquiles_pollo', 'fg_grasas', 1),
  ('eq_quesadilla_verduras', 'recipe_quesadilla_nopales', 'fg_verduras', 1),
  ('eq_quesadilla_frutas', 'recipe_quesadilla_nopales', 'fg_frutas', 1),
  ('eq_quesadilla_cereales', 'recipe_quesadilla_nopales', 'fg_cereales', 2),
  ('eq_quesadilla_aoa', 'recipe_quesadilla_nopales', 'fg_aoa', 1),
  ('eq_smoothie_frutas', 'recipe_smoothie_tostada', 'fg_frutas', 2),
  ('eq_smoothie_cereales', 'recipe_smoothie_tostada', 'fg_cereales', 2),
  ('eq_smoothie_aoa', 'recipe_smoothie_tostada', 'fg_aoa', 1),
  ('eq_smoothie_grasas', 'recipe_smoothie_tostada', 'fg_grasas', 1),
  ('eq_hotcakes_frutas', 'recipe_hotcakes_avena', 'fg_frutas', 1),
  ('eq_hotcakes_cereales', 'recipe_hotcakes_avena', 'fg_cereales', 2),
  ('eq_hotcakes_aoa', 'recipe_hotcakes_avena', 'fg_aoa', 1),
  ('eq_bowl_verduras', 'recipe_bowl_pollo_arroz', 'fg_verduras', 2),
  ('eq_bowl_cereales', 'recipe_bowl_pollo_arroz', 'fg_cereales', 2),
  ('eq_bowl_aoa', 'recipe_bowl_pollo_arroz', 'fg_aoa', 2),
  ('eq_bowl_grasas', 'recipe_bowl_pollo_arroz', 'fg_grasas', 1),
  ('eq_tacos_verduras', 'recipe_tacos_frijol_pollo', 'fg_verduras', 1),
  ('eq_tacos_cereales', 'recipe_tacos_frijol_pollo', 'fg_cereales', 2),
  ('eq_tacos_aoa', 'recipe_tacos_frijol_pollo', 'fg_aoa', 1),
  ('eq_tacos_leguminosas', 'recipe_tacos_frijol_pollo', 'fg_leguminosas', 1),
  ('eq_tacos_grasas', 'recipe_tacos_frijol_pollo', 'fg_grasas', 1)
ON CONFLICT ("recipeId", "foodGroupId") DO NOTHING;
