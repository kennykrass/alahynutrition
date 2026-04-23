import Link from "next/link";
import { UserRole } from "@prisma/client";

import { deletePatientAction, logoutAction } from "@/app/auth-actions";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(value);
}

type AdminDashboardPageProps = {
  searchParams?: {
    error?: string;
    success?: string;
  };
};

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const session = await requireRole(UserRole.ADMIN);

  const [adminUser, users, totalUsers, totalPatients, totalEntries] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId }
    }),
    prisma.user.findMany({
      include: {
        profile: true,
        entries: {
          orderBy: {
            loggedAt: "desc"
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.user.count(),
    prisma.user.count({
      where: { role: UserRole.PATIENT }
    }),
    prisma.progressEntry.count()
  ]);

  if (!adminUser) {
    return null;
  }

  return (
    <main className="px-6 py-8 md:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="glass stripe flex flex-col gap-6 rounded-[2rem] px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--text-soft)]">
              Panel administrativo
            </div>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl md:text-5xl">
              Hola, {adminUser.fullName}
            </h1>
            <p className="mt-3 max-w-3xl text-[color:var(--text-soft)]">
              Desde aqui podras supervisar pacientes, revisar registros recientes y preparar las
              siguientes herramientas internas del consultorio.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-mist/30 px-5 py-3 text-sm text-white transition hover:border-white"
              href="/"
            >
              Ver sitio publico
            </Link>
            <Link
              className="rounded-full border border-mist/30 px-5 py-3 text-sm text-white transition hover:border-white"
              href="/patient"
            >
              Vista de paciente
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

        <section className="mt-8 grid gap-6 md:grid-cols-4">
          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Usuarios
            </div>
            <div className="mt-4 text-3xl font-semibold text-white">{totalUsers}</div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Pacientes
            </div>
            <div className="mt-4 text-3xl font-semibold text-white">{totalPatients}</div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Administradores
            </div>
            <div className="mt-4 text-3xl font-semibold text-white">{totalUsers - totalPatients}</div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Registros
            </div>
            <div className="mt-4 text-3xl font-semibold text-white">{totalEntries}</div>
          </div>
        </section>

        {searchParams?.success ? (
          <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
            {searchParams.success}
          </div>
        ) : null}

        {searchParams?.error ? (
          <div className="mt-8 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
            {searchParams.error}
          </div>
        ) : null}

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Cuenta actual
            </div>
            <div className="mt-4 text-xl font-semibold text-white">{adminUser.email}</div>
            <div className="mt-2 text-sm text-[color:var(--text-soft)]">
              Acceso administrativo habilitado por rol.
            </div>

            <div className="mt-8 rounded-2xl border border-mist/20 p-4 text-sm text-[color:var(--text-soft)]">
              Para definir admins, agrega sus correos en `ADMIN_EMAILS` separados por coma en tu
              entorno local y en Vercel.
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
                Pacientes recientes
              </div>
              <span className="rounded-full border border-mist/20 px-3 py-1 text-xs text-[color:var(--text-soft)]">
                {users.length} usuarios en base
              </span>
            </div>

            <div className="mt-6 grid gap-4">
              {users.length ? (
                users.map((user) => (
                  <article key={user.id} className="rounded-2xl border border-mist/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-white">{user.fullName}</div>
                        <div className="text-sm text-[color:var(--text-soft)]">{user.email}</div>
                      </div>
                      <div className="rounded-full border border-mist/20 px-3 py-1 text-xs text-[color:var(--text-soft)]">
                        {user.role === UserRole.ADMIN ? "Administrador" : "Paciente"}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-[color:var(--text-soft)] md:grid-cols-3">
                      <div>Alta: {formatDate(user.createdAt)}</div>
                      <div>Meta: {user.profile?.goal || "Sin meta"}</div>
                      <div>
                        Ultimo registro:{" "}
                        {user.entries[0] ? formatDate(user.entries[0].loggedAt) : "Sin registros"}
                      </div>
                    </div>

                    {user.role === UserRole.PATIENT ? (
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                          className="rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/10"
                          href={`/admin/patients/${user.id}`}
                        >
                          Editar paciente
                        </Link>
                        <form action={deletePatientAction}>
                          <input name="userId" type="hidden" value={user.id} />
                          <button
                            className="rounded-full border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-300 hover:bg-rose-500/10"
                            type="submit"
                          >
                            Eliminar paciente
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-mist/20 p-6 text-sm text-[color:var(--text-soft)]">
                  Aun no hay usuarios registrados.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
