import Link from "next/link";
import { UserRole } from "@prisma/client";
import { notFound } from "next/navigation";

import { updatePatientAction } from "@/app/auth-actions";
import { prisma } from "@/lib/prisma";
import { requireCompletedPasswordSetup, requireRole } from "@/lib/session";

type AdminPatientEditPageProps = {
  params: {
    userId: string;
  };
  searchParams?: {
    error?: string;
    success?: string;
  };
};

function formatDateForInput(value?: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

export default async function AdminPatientEditPage({
  params,
  searchParams
}: AdminPatientEditPageProps) {
  await requireCompletedPasswordSetup();
  await requireRole(UserRole.ADMIN);

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      profile: true
    }
  });

  if (!user || user.role !== UserRole.PATIENT) {
    notFound();
  }

  return (
    <main className="px-6 py-8 md:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="glass stripe rounded-[2rem] px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--text-soft)]">
                Edicion de paciente
              </div>
              <h1 className="mt-4 font-[var(--font-display)] text-4xl md:text-5xl">
                {user.fullName}
              </h1>
              <p className="mt-3 max-w-2xl text-[color:var(--text-soft)]">
                Actualiza los datos generales y clinicos del paciente desde el panel admin.
              </p>
            </div>

            <Link
              className="rounded-full border border-mist/30 px-5 py-3 text-sm text-white transition hover:border-white"
              href="/admin"
            >
              Volver al admin
            </Link>
          </div>
        </header>

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

        <section className="mt-8 glass rounded-3xl p-6 md:p-8">
          <form action={updatePatientAction} className="grid gap-8">
            <input name="userId" type="hidden" value={user.id} />

            <div className="grid gap-6 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
                Nombre completo
                <input
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                  defaultValue={user.fullName}
                  name="fullName"
                  required
                  type="text"
                />
              </label>

              <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
                Correo electronico
                <input
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                  defaultValue={user.email}
                  name="email"
                  required
                  type="email"
                />
              </label>

              <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
                Telefono
                <input
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                  defaultValue={user.profile?.phone ?? ""}
                  name="phone"
                  type="text"
                />
              </label>

              <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
                Fecha de nacimiento
                <input
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                  defaultValue={formatDateForInput(user.profile?.birthDate)}
                  name="birthDate"
                  type="date"
                />
              </label>

              <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
                Altura (cm)
                <input
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                  defaultValue={user.profile?.heightCm ?? ""}
                  min="0"
                  name="heightCm"
                  step="0.1"
                  type="number"
                />
              </label>

              <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
                Peso inicial (kg)
                <input
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                  defaultValue={user.profile?.initialWeightKg ?? ""}
                  min="0"
                  name="initialWeightKg"
                  step="0.1"
                  type="number"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
              Meta
              <input
                className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                defaultValue={user.profile?.goal ?? ""}
                name="goal"
                type="text"
              />
            </label>

            <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
              Notas
              <textarea
                className="min-h-36 rounded-3xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                defaultValue={user.profile?.notes ?? ""}
                name="notes"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-glow px-5 py-3 text-sm font-semibold text-ink shadow-glow transition hover:translate-y-[-1px]"
                type="submit"
              >
                Guardar cambios
              </button>
              <Link
                className="rounded-full border border-mist/30 px-5 py-3 text-sm text-white transition hover:border-white"
                href="/admin"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
