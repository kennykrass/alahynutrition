import Link from "next/link";
import { UserRole } from "@prisma/client";

import {
  biochemicalIndicators,
  calculateAge,
  clinicalSections,
  familyHistoryRows,
  formatClinicalDate,
  getIndicatorPercent,
  gynecologicalRows
} from "@/lib/clinical-history";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

type ClinicalHistoryPageProps = {
  searchParams?: {
    patientId?: string;
  };
};

function formatSex(value?: string | null) {
  if (value === "MALE") {
    return "Masculino";
  }

  if (value === "FEMALE") {
    return "Femenino";
  }

  return "Pendiente";
}

function EmptyCell() {
  return <span className="block min-h-7 rounded-lg border border-mist/10 bg-white/5" />;
}

export default async function ClinicalHistoryPage({ searchParams }: ClinicalHistoryPageProps) {
  await requireRole(UserRole.ADMIN);

  const patients = await prisma.user.findMany({
    where: {
      role: UserRole.PATIENT
    },
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
    },
    take: 80
  });

  const selectedPatient =
    patients.find((patient) => patient.id === searchParams?.patientId) ?? patients[0] ?? null;
  const profile = selectedPatient?.profile;
  const lastEntry = selectedPatient?.entries[0];
  const age = calculateAge(profile?.birthDate);

  return (
    <main className="px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-mist/20 bg-ink/75 shadow-2xl shadow-cyan-950/30 backdrop-blur">
        <header className="grid border-b border-mist/15 bg-steel/80 md:grid-cols-[21rem_1fr]">
          <div className="flex items-center justify-center bg-ink/90 px-6 py-8">
            <Link className="text-left" href="/admin">
              <div className="font-[var(--font-display)] text-3xl font-bold leading-none text-glow">Alahy</div>
              <div className="text-sm uppercase tracking-[0.22em] text-[color:var(--text-soft)]">Nutrition</div>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 px-6 py-5">
            {clinicalSections.map((section, index) => (
              <div
                className={`grid h-16 w-16 place-items-center rounded-full border border-mist/20 bg-ink/80 text-lg font-bold text-glow shadow-glow ${
                  index === 0 ? "ring-4 ring-glow/40" : ""
                }`}
                key={section.value}
                title={section.label}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </header>

        <div className="grid md:grid-cols-[21rem_1fr]">
          <aside className="border-r border-mist/15 bg-ink/80">
            <form className="border-b border-mist/15 p-6">
              <label className="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--text-soft)]" htmlFor="patientId">
                Paciente
              </label>
              <select
                className="mt-3 w-full rounded-xl border border-mist/25 bg-ink/70 px-3 py-3 text-sm text-white outline-none focus:border-glow"
                defaultValue={selectedPatient?.id}
                id="patientId"
                name="patientId"
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {(patient.profile?.patientCode || "Sin ID") + " - " + patient.fullName}
                  </option>
                ))}
              </select>
              <button
                className="mt-3 w-full rounded-xl bg-glow px-4 py-3 text-sm font-bold text-ink shadow-glow transition hover:translate-y-[-1px]"
                type="submit"
              >
                Abrir expediente
              </button>
            </form>

            <section className="p-6 text-center">
              <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border-4 border-glow/50 bg-steel text-5xl text-white shadow-glow">
                {selectedPatient?.fullName?.charAt(0) ?? "P"}
              </div>

              <div className="mt-6 border-y border-mist/20 py-2 text-lg font-bold uppercase text-white">
                Ficha tecnica
              </div>

              <dl className="mt-4 grid gap-2 text-sm">
                <div>
                  <dt className="font-bold uppercase text-[color:var(--text-soft)]">Nombre</dt>
                  <dd className="mt-1 rounded-lg border border-glow/20 bg-glow/10 px-3 py-1 text-lg font-semibold text-glow">
                    {selectedPatient?.fullName ?? "Sin paciente"}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-[color:var(--text-soft)]">Sexo</dt>
                  <dd className="mt-1 rounded-lg border border-mist/10 bg-white/5 px-3 py-1">{formatSex(profile?.biologicalSex)}</dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-[color:var(--text-soft)]">Talla (m)</dt>
                  <dd className="mt-1 rounded-lg border border-mist/10 bg-white/5 px-3 py-1">
                    {profile?.heightCm ? (profile.heightCm / 100).toFixed(2) : "Pendiente"}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-[color:var(--text-soft)]">Edad</dt>
                  <dd className="mt-1 rounded-lg border border-mist/10 bg-white/5 px-3 py-1">{age ?? "Pendiente"}</dd>
                </div>
              </dl>
            </section>

            <section className="border-t border-mist/15 bg-steel/50 px-6 py-5 text-center text-white">
              <div className="font-bold uppercase">Fecha de registro</div>
              <div className="mt-1 rounded-lg bg-white/10 px-3 py-1 text-white">
                {formatClinicalDate(selectedPatient?.createdAt)}
              </div>
              <div className="mt-3 font-bold uppercase">Peso (kg)</div>
              <div className="mt-1 rounded-lg bg-white/10 px-3 py-1 text-white">
                {lastEntry?.weightKg ?? profile?.currentWeightKg ?? "Pendiente"}
              </div>
              <div className="mt-3 font-bold uppercase">Nivel de act. fisica</div>
              <div className="mt-1 rounded-lg bg-white/10 px-3 py-1 text-white">
                {profile?.physicalActivityLevel ?? "Pendiente"}
              </div>
              <div className="mt-3 font-bold uppercase">Objetivo</div>
              <div className="mt-1 rounded-lg bg-white/10 px-3 py-1 text-white">
                {profile?.goal || "Pendiente"}
              </div>
            </section>
          </aside>

          <section className="bg-ink/55">
            <div className="bg-steel px-6 py-2 text-center text-lg font-bold uppercase text-white">
              Historia clinica
            </div>

            <div className="px-6 py-6 lg:px-16">
              <section>
                <h2 className="border-b-2 border-glow/60 pb-1 text-2xl uppercase text-glow">
                  Antecedentes de salud
                </h2>
                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_16rem]">
                  <dl className="grid gap-2 text-base">
                    <div className="grid grid-cols-[14rem_1fr] gap-4">
                      <dt>Motivo de consulta:</dt>
                      <dd className="rounded-lg border border-mist/10 bg-white/5 px-3 py-1 text-center">{profile?.goal || "Pendiente"}</dd>
                    </div>
                    {["Padece alguna enfermedad?", "Toma medicamentos?", "Nombre / Dosis", "Consumo de alcohol", "Consumo de tabaco"].map(
                      (label) => (
                        <div className="grid grid-cols-[14rem_1fr] gap-4" key={label}>
                          <dt>{label}</dt>
                          <dd><EmptyCell /></dd>
                        </div>
                      )
                    )}
                  </dl>
                </div>
              </section>

              <section className="mt-8">
                <div className="rounded-2xl bg-steel px-4 py-2 text-center text-lg font-bold uppercase text-white">
                  Antecedentes familiares
                </div>
                <div className="mt-8 overflow-hidden rounded-sm">
                  <div className="grid grid-cols-[1.5fr_repeat(3,0.42fr)] bg-white/10 text-center text-lg uppercase text-glow">
                    <span className="py-2">Padecimientos</span>
                    <span className="py-2">Madre</span>
                    <span className="py-2">Padre</span>
                    <span className="py-2">Paciente</span>
                  </div>
                  {familyHistoryRows.map((row, index) => (
                    <div
                      className={`grid grid-cols-[1.5fr_repeat(3,0.42fr)] text-sm ${
                        index % 2 === 0 ? "bg-white/5" : "bg-white/10"
                      }`}
                      key={row}
                    >
                      <span className="px-2 py-2 font-semibold">{row}</span>
                      <span className="border-l border-mist/10" />
                      <span className="border-l border-mist/10" />
                      <span className="border-l border-mist/10" />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-right text-sm font-semibold italic">Marcar (+) si lo padece.</p>
              </section>

              <section className="mt-12 grid gap-10 lg:grid-cols-2">
                <div>
                  <h2 className="border-b-2 border-glow/60 pb-1 text-2xl uppercase text-glow">
                    Aspectos ginecologicos
                  </h2>
                  <div className="mt-6 grid gap-2">
                    {gynecologicalRows.map((row) => (
                      <div className="grid grid-cols-[1fr_16rem] gap-6" key={row}>
                        <span>{row}</span>
                        <EmptyCell />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="border-b-2 border-glow/60 pb-1 text-2xl uppercase text-glow">
                    Signos y sintomas
                  </h2>
                  <div className="mt-6">
                    <div className="text-center text-lg font-semibold">
                      Aspecto general
                    </div>
                    <div className="mt-2 min-h-28 rounded-2xl border border-mist/10 bg-white/5 p-3 text-sm text-[color:var(--text-soft)]">
                      Aspecto general normal
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-12">
                <div className="rounded-2xl bg-steel px-4 py-2 text-center text-lg font-bold uppercase text-white">
                  Analisis bioquimicos
                </div>
                <div className="mt-8 grid gap-5">
                  <div className="grid grid-cols-[1fr_0.55fr_1fr_1fr] gap-6 text-center text-lg font-semibold text-[color:var(--text-soft)]">
                    <span>Indicador</span>
                    <span>Valor</span>
                    <span>Valor de ref</span>
                    <span>Rango visual</span>
                  </div>
                  {biochemicalIndicators.map((indicator) => (
                    <div className="grid grid-cols-[1fr_0.55fr_1fr_1fr] items-center gap-6" key={indicator.label}>
                      <span className="text-right">{indicator.label}</span>
                      <span className="rounded-lg bg-glow/10 py-2 text-center text-glow">{indicator.value}</span>
                      <span className="rounded-lg bg-white/10 py-2 text-center text-[color:var(--text-soft)]">{indicator.reference}</span>
                      <div>
                        <div className="h-6 rounded-full border border-mist/10 bg-gradient-to-r from-glow/70 via-emerald-300/80 to-rose-300/80">
                          <div
                            className="h-full border-r-2 border-white/80"
                            style={{ width: `${getIndicatorPercent(indicator.goodUntil, indicator.max)}%` }}
                          />
                        </div>
                        <div className="mt-1 flex justify-between text-xs text-[color:var(--text-soft)]">
                          <span>0</span>
                          <span>{indicator.goodUntil}</span>
                          <span>{indicator.max}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-12">
                <div className="rounded-2xl bg-steel px-4 py-2 text-center text-lg font-bold uppercase text-white">
                  Comentarios generales
                </div>
                <div className="mx-auto mt-8 min-h-36 max-w-3xl rounded-2xl border border-mist/10 bg-white/5 p-3 text-[color:var(--text-soft)]">
                  {profile?.notes || "Sin comentarios generales registrados."}
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
