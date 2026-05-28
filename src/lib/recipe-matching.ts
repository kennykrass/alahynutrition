type EquivalentInput = Record<string, number>;

type RecipeForMatching = {
  equivalents: {
    amount: number;
    foodGroup: {
      slug: string;
    };
  }[];
};

export const mealTypeOptions = [
  { value: "BREAKFAST", label: "Desayuno" },
  { value: "LUNCH", label: "Comida" },
  { value: "DINNER", label: "Cena" },
  { value: "SNACK", label: "Colacion" }
];

export function parseEquivalentTargets(
  values: Record<string, string | string[] | undefined>,
  groupSlugs: string[]
) {
  return groupSlugs.reduce<EquivalentInput>((targets, slug) => {
    const rawValue = values[slug];
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    const parsed = Number(value ?? 0);
    targets[slug] = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    return targets;
  }, {});
}

export function getRecipeEquivalentMap(recipe: RecipeForMatching) {
  return recipe.equivalents.reduce<EquivalentInput>((values, equivalent) => {
    values[equivalent.foodGroup.slug] = equivalent.amount;
    return values;
  }, {});
}

export function scoreRecipeMatch(targets: EquivalentInput, recipe: RecipeForMatching) {
  const recipeValues = getRecipeEquivalentMap(recipe);
  const slugs = Array.from(new Set([...Object.keys(targets), ...Object.keys(recipeValues)]));
  const selectedTotal = slugs.reduce((total, slug) => total + (targets[slug] ?? 0), 0);
  const recipeTotal = slugs.reduce((total, slug) => total + (recipeValues[slug] ?? 0), 0);

  if (selectedTotal === 0) {
    return {
      distance: 0,
      score: 100,
      label: "Base sugerida",
      tone: "cyan"
    };
  }

  const distance = slugs.reduce(
    (total, slug) => total + Math.abs((targets[slug] ?? 0) - (recipeValues[slug] ?? 0)),
    0
  );
  const denominator = Math.max(selectedTotal, recipeTotal, 1);
  const score = Math.max(0, Math.round(100 - (distance / denominator) * 100));

  if (distance === 0) {
    return { distance, score, label: "Exacta", tone: "emerald" };
  }

  if (score >= 75) {
    return { distance, score, label: "Muy similar", tone: "emerald" };
  }

  if (score >= 45) {
    return { distance, score, label: "Similar", tone: "amber" };
  }

  return { distance, score, label: "Lejana", tone: "slate" };
}
