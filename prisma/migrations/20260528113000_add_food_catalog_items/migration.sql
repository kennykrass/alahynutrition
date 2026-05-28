-- CreateTable
CREATE TABLE "FoodCatalogItem" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourcePage" INTEGER NOT NULL,
    "groupName" TEXT NOT NULL,
    "groupSlug" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "suggestedAmount" TEXT,
    "unit" TEXT,
    "grossWeightG" DOUBLE PRECISION,
    "netWeightG" DOUBLE PRECISION,
    "energyKcal" DOUBLE PRECISION,
    "proteinG" DOUBLE PRECISION,
    "lipidsG" DOUBLE PRECISION,
    "carbsG" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodCatalogItem_source_sourcePage_foodName_suggestedAmount_unit_key" ON "FoodCatalogItem"("source", "sourcePage", "foodName", "suggestedAmount", "unit");

-- CreateIndex
CREATE INDEX "FoodCatalogItem_groupSlug_idx" ON "FoodCatalogItem"("groupSlug");

-- CreateIndex
CREATE INDEX "FoodCatalogItem_foodName_idx" ON "FoodCatalogItem"("foodName");
