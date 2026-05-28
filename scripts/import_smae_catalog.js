const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const groupSlugMap = new Map([
  ["verduras", "verduras"],
  ["frutas", "frutas"],
  ["cereales y tuberculos", "cereales"],
  ["cereales", "cereales"],
  ["leguminosas", "leguminosas"],
  ["alimentos de origen animal", "aoa"],
  ["leche", "leche"],
  ["aceites y grasas", "grasas"],
  ["grasas", "grasas"],
  ["azucares", "azucares"],
  ["bebidas", "bebidas"],
  ["libres en energia", "libres-en-energia"],
  ["sin clasificar", "sin-clasificar"]
]);

function normalizeGroupSlug(groupName) {
  return groupSlugMap.get(String(groupName).trim().toLowerCase()) || "sin-clasificar";
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error("Usage: node scripts/import_smae_catalog.js data/smae/smae_foods.json");
  }

  const absolutePath = path.resolve(inputPath);
  const rows = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const foodName = String(row.food || "").trim();

    if (!foodName || foodName.length < 3) {
      skipped += 1;
      continue;
    }

    const source = String(row.source || "SMAE 5a ed");
    const sourcePage = Number(row.page);
    const suggestedAmount = row.suggested_amount ? String(row.suggested_amount).trim() : "";
    const unit = row.unit ? String(row.unit).trim() : "";

    await prisma.foodCatalogItem.upsert({
      where: {
        source_sourcePage_foodName_suggestedAmount_unit: {
          source,
          sourcePage,
          foodName,
          suggestedAmount,
          unit
        }
      },
      update: {
        groupName: String(row.group || "Sin clasificar"),
        groupSlug: normalizeGroupSlug(row.group),
        grossWeightG: toNullableNumber(row.gross_weight_g),
        netWeightG: toNullableNumber(row.net_weight_g),
        energyKcal: toNullableNumber(row.energy_kcal),
        proteinG: toNullableNumber(row.protein_g),
        lipidsG: toNullableNumber(row.lipids_g),
        carbsG: toNullableNumber(row.carbs_g)
      },
      create: {
        source,
        sourcePage,
        groupName: String(row.group || "Sin clasificar"),
        groupSlug: normalizeGroupSlug(row.group),
        foodName,
        suggestedAmount,
        unit,
        grossWeightG: toNullableNumber(row.gross_weight_g),
        netWeightG: toNullableNumber(row.net_weight_g),
        energyKcal: toNullableNumber(row.energy_kcal),
        proteinG: toNullableNumber(row.protein_g),
        lipidsG: toNullableNumber(row.lipids_g),
        carbsG: toNullableNumber(row.carbs_g)
      }
    });

    imported += 1;
  }

  console.log(JSON.stringify({ imported, skipped }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
