import Link from "next/link";
import { UserRole } from "@prisma/client";
import { notFound } from "next/navigation";

import { updatePatientAction } from "@/app/auth-actions";
import { patientProfileCatalogs } from "@/lib/patient-profile-catalogs";
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

function calculateAgeFromBirthDate(value?: Date | null) {
  if (!value) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - value.getFullYear();
  const hasNotHadBirthdayYet =
    today.getMonth() < value.getMonth() ||
    (today.getMonth() === value.getMonth() && today.getDate() < value.getDate());

  if (hasNotHadBirthdayYet) {
    age -= 1;
  }

  return age;
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

  const calculatedAge = calculateAgeFromBirthDate(user.profile?.birthDate);

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

            <div className="grid gap-4 rounded-3xl border border-mist/15 bg-ink/40 p-5 md:grid-cols-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                  Codigo
                </div>
                <div className="mt-2 text-base font-semibold text-white">
                  {user.profile?.patientCode || "Pendiente"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                  Edad calculada
                </div>
                <div className="mt-2 text-base font-semibold text-white">
                  {calculatedAge !== null ? `${calculatedAge} anos` : "Pendiente"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                  Alta
                </div>
                <div className="mt-2 text-base font-semibold text-white">
                  {formatDateForInput(user.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                  Cuenta
                </div>
                <div className="mt-2 text-base font-semibold text-white">Paciente</div>
              </div>
            </div>

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
                Genero biologico
                <select
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition focus:border-glow"
                  defaultValue={user.profile?.biologicalSex ?? ""}
                  name="biologicalSex"
                >
                  <option value="">Selecciona una opcion</option>
                  {patientProfileCatalogs.biologicalSex.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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

              <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
                Peso actual (kg)
                <input
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                  defaultValue={user.profile?.currentWeightKg ?? ""}
                  min="0"
                  name="currentWeightKg"
                  step="0.1"
                  type="number"
                />
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
                Tipo de atencion
                <select
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition focus:border-glow"
                  defaultValue={user.profile?.careType ?? ""}
                  name="careType"
                >
                  <option value="">Selecciona una opcion</option>
                  {patientProfileCatalogs.careType.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
                Duracion del plan
                <select
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition focus:border-glow"
                  defaultValue={user.profile?.planDuration ?? ""}
                  name="planDuration"
                >
                  <option value="">Selecciona una opcion</option>
                  {patientProfileCatalogs.planDuration.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
                Estatus
                <select
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition focus:border-glow"
                  defaultValue={user.profile?.status ?? ""}
                  name="status"
                >
                  {patientProfileCatalogs.patientStatus.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
                Actividad fisica
                <select
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition focus:border-glow"
                  defaultValue={user.profile?.physicalActivityLevel ?? ""}
                  name="physicalActivityLevel"
                >
                  <option value="">Selecciona una opcion</option>
                  {patientProfileCatalogs.physicalActivityLevel.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
                Ha llevado plan antes
                <select
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition focus:border-glow"
                  defaultValue={
                    user.profile?.previousDietExperience === undefined
                      ? ""
                      : user.profile.previousDietExperience
                        ? "yes"
                        : "no"
                  }
                  name="previousDietExperience"
                >
                  <option value="">Selecciona una opcion</option>
                  <option value="yes">Si</option>
                  <option value="no">No</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
                Cuanto tiempo llevo ese plan
                <input
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                  defaultValue={user.profile?.previousDietDuration ?? ""}
                  name="previousDietDuration"
                  placeholder="Ej. 6 meses, 1 ano, 8 semanas"
                  type="text"
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
              Horarios para contacto o recordatorios
              <input
                className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                defaultValue={user.profile?.contactSchedule ?? ""}
                name="contactSchedule"
                placeholder="Ej. Lunes a viernes despues de las 6 pm"
                type="text"
              />
            </label>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
                Medicamentos
                <textarea
                  className="min-h-28 rounded-3xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                  defaultValue={user.profile?.medications ?? ""}
                  name="medications"
                  placeholder="Medicamentos actuales o relevantes"
                />
              </label>

              <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
                Alergias a alimentos
                <textarea
                  className="min-h-28 rounded-3xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                  defaultValue={user.profile?.foodAllergies ?? ""}
                  name="foodAllergies"
                  placeholder="Alergias alimentarias conocidas"
                />
              </label>
            </div>

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
