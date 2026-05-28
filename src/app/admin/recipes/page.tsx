import Link from "next/link";
import { UserRole } from "@prisma/client";

import {
  getRecipeEquivalentMap,
  mealTypeOptions,
  parseEquivalentTargets,
  scoreRecipeMatch
} from "@/lib/recipe-matching";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

type RecipeEquivalentsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const defaultTargets: Record<string, number> = {
  verduras: 1,
  frutas: 1,
  cereales: 2,
  aoa: 1,
  leguminosas: 0,
  grasas: 1,
  azucares: 0
};

function getToneClasses(tone: string) {
  switch (tone) {
    case "emerald":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
    case "amber":
      return "border-amber-400/30 bg-amber-500/10 text-amber-100";
    case "cyan":
      return "border-cyan-400/30 bg-cyan-500/10 text-cyan-100";
    default:
      return "border-mist/20 bg-white/5 text-[color:var(--text-soft)]";
  }
}

export default async function RecipeEquivalentsPage({ searchParams }: RecipeEquivalentsPageProps) {
  await requireRole(UserRole.ADMIN);

  const selectedMealType =
    typeof searchParams?.mealType === "string" && searchParams.mealType
      ? searchParams.mealType
      : "BREAKFAST";

  const foodGroups = await prisma.foodGroup.findMany({
    where: {
      isActive: true
    },
    orderBy: {
      sortOrder: "asc"
    }
  });

  const hasSelectedTargets = foodGroups.some((group) => searchParams?.[group.slug] !== undefined);
  const parsedTargets = parseEquivalentTargets(searchParams ?? {}, foodGroups.map((group) => group.slug));
  const targets = foodGroups.reduce<Record<string, number>>((values, group) => {
    values[group.slug] = hasSelectedTargets ? parsedTargets[group.slug] ?? 0 : defaultTargets[group.slug] ?? 0;
    return values;
  }, {});

  const recipes = await prisma.recipe.findMany({
    where: {
      isActive: true,
      mealType: selectedMealType
    },
    include: {
      equivalents: {
        include: {
          foodGroup: true
        }
      }
    },
    orderBy: {
      title: "asc"
    }
  });

  const scoredRecipes = recipes
    .map((recipe) => ({
      recipe,
      equivalents: getRecipeEquivalentMap(recipe),
      match: scoreRecipeMatch(targets, recipe)
    }))
    .sort((left, right) => right.match.score - left.match.score || left.match.distance - right.match.distance);

  const selectedSummary = foodGroups.filter((group) => (targets[group.slug] ?? 0) > 0);

  return (
    <main className="px-6 py-8 md:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="glass stripe flex flex-col gap-6 rounded-[2rem] px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--text-soft)]">
              Recetas por equivalentes
            </div>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl md:text-5xl">
              Tablero visual de recetas
            </h1>
            <p className="mt-3 max-w-3xl text-[color:var(--text-soft)]">
              Selecciona los equivalentes por grupo y encuentra recetas que coincidan o se acerquen
              al objetivo del tiempo de comida.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-mist/30 px-5 py-3 text-sm text-white transition hover:border-white"
              href="/admin"
            >
              Volver al panel
            </Link>
            <Link
              className="rounded-full bg-glow px-5 py-3 text-sm font-semibold text-ink shadow-glow"
              href="/admin/recipes"
            >
              Reiniciar
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <aside className="glass rounded-3xl p-6">
            <form className="grid gap-6">
              <div>
                <label className="text-sm font-semibold text-white" htmlFor="mealType">
                  1. Selecciona el tiempo de comida
                </label>
                <select
                  className="mt-3 w-full rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                  defaultValue={selectedMealType}
                  id="mealType"
                  name="mealType"
                >
                  {mealTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-sm font-semibold text-white">2. Elige tus equivalentes</div>
                <div className="mt-3 overflow-hidden rounded-3xl border border-mist/20">
                  <div className="grid grid-cols-[1fr_7rem] bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.18em] text-[color:var(--text-soft)]">
                    <span>Grupo</span>
                    <span className="text-right">Cantidad</span>
                  </div>
                  {foodGroups.map((group) => (
                    <label
                      className="grid grid-cols-[1fr_7rem] items-center gap-3 border-t border-mist/10 px-4 py-3"
                      key={group.id}
                    >
                      <span className="flex items-center gap-3 text-sm text-white">
                        <span className="text-xl" aria-hidden="true">
                          {group.icon}
                        </span>
                        <span>
                          <span className="block font-semibold">{group.shortName}</span>
                          <span className="block text-xs text-[color:var(--text-soft)]">{group.name}</span>
                        </span>
                      </span>
                      <input
                        className="rounded-2xl border border-mist/25 bg-ink/70 px-3 py-2 text-right text-sm text-white outline-none transition focus:border-glow"
                        defaultValue={targets[group.slug] ?? 0}
                        min="0"
                        name={group.slug}
                        step="0.5"
                        type="number"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                <div className="text-sm font-semibold text-emerald-100">
                  Resumen de equivalentes seleccionados
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {selectedSummary.length ? (
                    selectedSummary.map((group) => (
                      <div
                        className="rounded-2xl border border-emerald-300/20 bg-black/10 px-3 py-3 text-center"
                        key={group.id}
                      >
                        <div className="text-xl">{group.icon}</div>
                        <div className="mt-1 text-xs text-emerald-50">{group.shortName}</div>
                        <div className="mt-1 text-lg font-semibold text-white">{targets[group.slug]}</div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-sm text-emerald-100">
                      Sin equivalentes seleccionados.
                    </div>
                  )}
                </div>
              </div>

              <button
                className="rounded-full bg-glow px-4 py-3 text-sm font-semibold text-ink shadow-glow transition hover:translate-y-[-1px]"
                type="submit"
              >
                Buscar recetas
              </button>
            </form>
          </aside>

          <section className="glass rounded-3xl p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
                  3. Recetas sugeridas
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {scoredRecipes.length} opciones encontradas
                </h2>
              </div>
              <div className="rounded-full border border-mist/20 px-4 py-2 text-sm text-[color:var(--text-soft)]">
                {mealTypeOptions.find((option) => option.value === selectedMealType)?.label ?? selectedMealType}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Las recetas se ordenan por cercania a los equivalentes seleccionados. El motor ya queda
              listo para crecer con el catalogo SMAE completo.
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              {scoredRecipes.length ? (
                scoredRecipes.map(({ recipe, equivalents, match }) => (
                  <article className="overflow-hidden rounded-3xl border border-mist/20 bg-ink/45" key={recipe.id}>
                    {recipe.imageUrl ? (
                      <div
                        aria-hidden="true"
                        className="h-48 w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${recipe.imageUrl})` }}
                      />
                    ) : null}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold text-white">{recipe.title}</h3>
                        <span
                          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getToneClasses(
                            match.tone
                          )}`}
                        >
                          {match.label}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-[color:var(--text-soft)]">{recipe.description}</p>

                      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
                        {foodGroups.map((group) => (
                          <div
                            className="rounded-2xl border border-mist/15 bg-white/5 px-2 py-2 text-center"
                            key={group.id}
                            title={group.name}
                          >
                            <div className="text-lg">{group.icon}</div>
                            <div className="mt-1 text-sm font-semibold text-white">
                              {equivalents[group.slug] ?? 0}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                        <span className="text-[color:var(--text-soft)]">{recipe.prepMinutes} min</span>
                        <span className="rounded-full border border-mist/20 px-3 py-1 text-[color:var(--text-soft)]">
                          Match {match.score}%
                        </span>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-mist/20 p-6 text-sm text-[color:var(--text-soft)]">
                  Todavia no hay recetas para este tiempo de comida en el catalogo MVP.
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
