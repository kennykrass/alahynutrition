import Link from "next/link";
import { Prisma, UserRole } from "@prisma/client";

import {
  foodCatalogGroups,
  formatCatalogNumber,
  getFoodCatalogGroupLabel
} from "@/lib/food-catalog";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

type FoodCatalogPageProps = {
  searchParams?: {
    query?: string;
    group?: string;
    page?: string;
  };
};

const pageSize = 40;

function buildPageHref(params: FoodCatalogPageProps["searchParams"], page: number) {
  const nextParams = new URLSearchParams();

  if (params?.query) {
    nextParams.set("query", params.query);
  }

  if (params?.group) {
    nextParams.set("group", params.group);
  }

  if (page > 1) {
    nextParams.set("page", String(page));
  }

  const queryString = nextParams.toString();
  return queryString ? `/admin/food-catalog?${queryString}` : "/admin/food-catalog";
}

export default async function FoodCatalogPage({ searchParams }: FoodCatalogPageProps) {
  await requireRole(UserRole.ADMIN);

  const query = searchParams?.query?.trim() ?? "";
  const group = searchParams?.group?.trim() ?? "";
  const currentPage = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const where: Prisma.FoodCatalogItemWhereInput = {
    ...(query
      ? {
          foodName: {
            contains: query,
            mode: "insensitive"
          }
        }
      : {}),
    ...(group ? { groupSlug: group } : {})
  };

  const [items, totalItems, groupCounts] = await Promise.all([
    prisma.foodCatalogItem.findMany({
      where,
      orderBy: [{ groupSlug: "asc" }, { foodName: "asc" }],
      skip: (currentPage - 1) * pageSize,
      take: pageSize
    }),
    prisma.foodCatalogItem.count({ where }),
    prisma.foodCatalogItem.groupBy({
      by: ["groupSlug"],
      _count: { _all: true },
      orderBy: { groupSlug: "asc" }
    })
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <main className="px-6 py-8 md:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="glass stripe flex flex-col gap-6 rounded-[2rem] px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--text-soft)]">
              Catalogo de alimentos
            </div>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl md:text-5xl">
              Porciones y macros SMAE
            </h1>
            <p className="mt-3 max-w-3xl text-[color:var(--text-soft)]">
              Consulta los alimentos importados del catalogo interno por grupo, porcion sugerida y
              valores nutrimentales principales.
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
              className="rounded-full border border-mist/30 px-5 py-3 text-sm text-white transition hover:border-white"
              href="/admin/recipes"
            >
              Recetas por equivalentes
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {groupCounts.map((groupCount) => (
            <Link
              className="glass rounded-3xl p-5 transition hover:border-glow"
              href={`/admin/food-catalog?group=${encodeURIComponent(groupCount.groupSlug)}`}
              key={groupCount.groupSlug}
            >
              <div className="text-xs uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
                {getFoodCatalogGroupLabel(groupCount.groupSlug)}
              </div>
              <div className="mt-3 text-3xl font-semibold text-white">{groupCount._count._all}</div>
            </Link>
          ))}
        </section>

        <section className="mt-8 glass rounded-3xl p-6">
          <form className="grid gap-3 md:grid-cols-[1fr_16rem_auto_auto]">
            <input
              className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
              defaultValue={query}
              name="query"
              placeholder="Buscar alimento"
              type="text"
            />
            <select
              className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
              defaultValue={group}
              name="group"
            >
              <option value="">Todos los grupos</option>
              {foodCatalogGroups.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              className="rounded-full bg-glow px-5 py-3 text-sm font-semibold text-ink shadow-glow transition hover:translate-y-[-1px]"
              type="submit"
            >
              Buscar
            </button>
            <Link
              className="rounded-full border border-mist/25 px-5 py-3 text-center text-sm text-white transition hover:border-white"
              href="/admin/food-catalog"
            >
              Limpiar
            </Link>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--text-soft)]">
            <span>
              {totalItems} alimentos encontrados
              {group ? ` en ${getFoodCatalogGroupLabel(group)}` : ""}
            </span>
            <span>
              Pagina {currentPage} de {totalPages}
            </span>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-mist/20">
            <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr_repeat(4,0.55fr)] gap-3 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.16em] text-[color:var(--text-soft)] lg:grid">
              <span>Alimento</span>
              <span>Grupo</span>
              <span>Porcion</span>
              <span>Kcal</span>
              <span>Prot</span>
              <span>Lip</span>
              <span>CHO</span>
            </div>
            <div className="divide-y divide-mist/10">
              {items.length ? (
                items.map((item) => (
                  <article
                    className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[1.4fr_0.8fr_0.8fr_repeat(4,0.55fr)] lg:items-center"
                    key={item.id}
                  >
                    <div>
                      <div className="font-semibold text-white">{item.foodName}</div>
                      <div className="mt-1 text-xs text-[color:var(--text-soft)]">
                        Pagina fuente {item.sourcePage}
                      </div>
                    </div>
                    <div className="text-[color:var(--text-soft)]">
                      {getFoodCatalogGroupLabel(item.groupSlug)}
                    </div>
                    <div className="text-white">
                      {[item.suggestedAmount, item.unit].filter(Boolean).join(" ") || "ND"}
                    </div>
                    <div>{formatCatalogNumber(item.energyKcal)}</div>
                    <div>{formatCatalogNumber(item.proteinG, " g")}</div>
                    <div>{formatCatalogNumber(item.lipidsG, " g")}</div>
                    <div>{formatCatalogNumber(item.carbsG, " g")}</div>
                  </article>
                ))
              ) : (
                <div className="p-6 text-sm text-[color:var(--text-soft)]">
                  No hay alimentos con esos filtros.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            {currentPage > 1 ? (
              <Link
                className="rounded-full border border-mist/25 px-5 py-2 text-sm text-white transition hover:border-white"
                href={buildPageHref(searchParams, currentPage - 1)}
              >
                Anterior
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link
                className="rounded-full border border-mist/25 px-5 py-2 text-sm text-white transition hover:border-white"
                href={buildPageHref(searchParams, currentPage + 1)}
              >
                Siguiente
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
