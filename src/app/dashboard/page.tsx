import Link from "next/link";

import { logoutAction } from "@/app/auth-actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(value);
}

export default async function DashboardPage() {
  const session = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      profile: true,
      entries: {
        orderBy: {
          loggedAt: "desc"
        },
        take: 3
      }
    }
  });

  if (!user) {
    return null;
  }

  return (
    <main className="px-6 py-8 md:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="glass stripe flex flex-col gap-6 rounded-[2rem] px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--text-soft)]">
              Panel del paciente
            </div>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl md:text-5xl">
              Hola, {user.fullName}
            </h1>
            <p className="mt-3 max-w-2xl text-[color:var(--text-soft)]">
              Esta es la base de tu portal. Aqui iran tus datos clinicos, avances, historial y
              ajustes personalizados.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-mist/30 px-5 py-3 text-sm text-white transition hover:border-white"
              href="/"
            >
              Ver sitio publico
            </Link>
            <form action={logoutAction}>
              <button
                className="rounded-full bg-glow px-5 py-3 text-sm font-semibold text-ink shadow-glow"
                type="submit"
              >
                Cerrar sesion
              </button>
            </form>
          </div>
        </header>

        <section className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Cuenta
            </div>
            <div className="mt-4 text-xl font-semibold text-white">{user.email}</div>
            <div className="mt-2 text-sm text-[color:var(--text-soft)]">
              Rol actual: {user.role === "ADMIN" ? "Administrador" : "Paciente"}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Perfil
            </div>
            <div className="mt-4 text-xl font-semibold text-white">
              {user.profile?.goal || "Meta pendiente por registrar"}
            </div>
            <div className="mt-2 text-sm text-[color:var(--text-soft)]">
              Altura: {user.profile?.heightCm ? `${user.profile.heightCm} cm` : "Sin capturar"}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Progreso
            </div>
            <div className="mt-4 text-xl font-semibold text-white">
              {user.entries.length} registros disponibles
            </div>
            <div className="mt-2 text-sm text-[color:var(--text-soft)]">
              Proximamente aqui viviran graficas y comparativas.
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Datos iniciales
            </div>
            <dl className="mt-6 grid gap-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-mist/10 pb-4">
                <dt className="text-[color:var(--text-soft)]">Telefono</dt>
                <dd className="text-white">{user.profile?.phone || "Pendiente"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-mist/10 pb-4">
                <dt className="text-[color:var(--text-soft)]">Peso inicial</dt>
                <dd className="text-white">
                  {user.profile?.initialWeightKg ? `${user.profile.initialWeightKg} kg` : "Pendiente"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-mist/10 pb-4">
                <dt className="text-[color:var(--text-soft)]">Meta</dt>
                <dd className="text-white">{user.profile?.goal || "Pendiente"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[color:var(--text-soft)]">Notas</dt>
                <dd className="max-w-[16rem] text-right text-white">
                  {user.profile?.notes || "Sin notas registradas."}
                </dd>
              </div>
            </dl>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
                Historial reciente
              </div>
              <span className="rounded-full border border-mist/20 px-3 py-1 text-xs text-[color:var(--text-soft)]">
                Base lista para crecer
              </span>
            </div>

            <div className="mt-6 grid gap-4">
              {user.entries.length ? (
                user.entries.map((entry) => (
                  <article key={entry.id} className="rounded-2xl border border-mist/20 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                      {formatDate(entry.loggedAt)}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-white">
                      <span>{entry.weightKg ? `${entry.weightKg} kg` : "Peso sin registrar"}</span>
                      <span>{entry.waistCm ? `${entry.waistCm} cm cintura` : "Cintura sin registrar"}</span>
                      <span>
                        {entry.bodyFatPct ? `${entry.bodyFatPct}% grasa corporal` : "Sin grasa corporal"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[color:var(--text-soft)]">
                      {entry.notes || "Sin notas para este registro."}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-mist/20 p-6 text-sm text-[color:var(--text-soft)]">
                  Aun no hay registros de progreso. La estructura ya esta lista para empezar a
                  capturarlos desde la siguiente iteracion.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
