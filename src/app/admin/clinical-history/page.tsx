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
  return <span className="block min-h-7 border-b border-slate-200 bg-slate-50" />;
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
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 md:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
        <header className="grid border-b border-slate-200 bg-cyan-400 md:grid-cols-[21rem_1fr]">
          <div className="flex items-center justify-center bg-white px-6 py-8">
            <Link className="text-left" href="/admin">
              <div className="text-2xl font-bold leading-none text-teal-600">Alahy</div>
              <div className="text-sm uppercase tracking-[0.22em] text-slate-500">Nutrition</div>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 px-6 py-5">
            {clinicalSections.map((section, index) => (
              <div
                className={`grid h-16 w-16 place-items-center rounded-full bg-sky-700 text-2xl text-white shadow-lg ${
                  index === 0 ? "ring-4 ring-lime-300" : ""
                }`}
                key={section.value}
                title={section.label}
              >
                {index === 0 ? "☑" : index === 1 ? "◌" : index === 2 ? "↗" : "◫"}
              </div>
            ))}
          </div>
        </header>

        <div className="grid md:grid-cols-[21rem_1fr]">
          <aside className="border-r border-slate-200 bg-slate-50">
            <form className="border-b border-slate-200 p-6">
              <label className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500" htmlFor="patientId">
                Paciente
              </label>
              <select
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-cyan-500"
                defaultValue={selectedPatient?.id}
                id="patientId"
                name="patientId"
              >
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {(patient.profile?.patientCode || "Sin ID") + " · " + patient.fullName}
                  </option>
                ))}
              </select>
              <button
                className="mt-3 w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-600"
                type="submit"
              >
                Abrir expediente
              </button>
            </form>

            <section className="p-6 text-center">
              <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border-4 border-cyan-300 bg-cyan-500 text-5xl text-white shadow-lg">
                {selectedPatient?.fullName?.charAt(0) ?? "P"}
              </div>

              <div className="mt-6 border-y border-slate-300 py-2 text-lg font-bold uppercase text-slate-700">
                Ficha tecnica
              </div>

              <dl className="mt-4 grid gap-2 text-sm">
                <div>
                  <dt className="font-bold uppercase text-slate-600">Nombre</dt>
                  <dd className="mt-1 bg-cyan-50 px-3 py-1 text-lg font-semibold text-teal-700">
                    {selectedPatient?.fullName ?? "Sin paciente"}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-slate-600">Sexo</dt>
                  <dd className="mt-1 bg-cyan-50 px-3 py-1">{formatSex(profile?.biologicalSex)}</dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-slate-600">Talla (m)</dt>
                  <dd className="mt-1 bg-cyan-50 px-3 py-1">
                    {profile?.heightCm ? (profile.heightCm / 100).toFixed(2) : "Pendiente"}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-slate-600">Edad</dt>
                  <dd className="mt-1 bg-cyan-50 px-3 py-1">{age ?? "Pendiente"}</dd>
                </div>
              </dl>
            </section>

            <section className="bg-cyan-500 px-6 py-5 text-center text-white">
              <div className="font-bold uppercase">Fecha de registro</div>
              <div className="mt-1 bg-white px-3 py-1 text-slate-950">
                {formatClinicalDate(selectedPatient?.createdAt)}
              </div>
              <div className="mt-3 font-bold uppercase">Peso (kg)</div>
              <div className="mt-1 bg-white px-3 py-1 text-slate-950">
                {lastEntry?.weightKg ?? profile?.currentWeightKg ?? "Pendiente"}
              </div>
              <div className="mt-3 font-bold uppercase">Nivel de act. fisica</div>
              <div className="mt-1 bg-white px-3 py-1 text-slate-950">
                {profile?.physicalActivityLevel ?? "Pendiente"}
              </div>
              <div className="mt-3 font-bold uppercase">Objetivo</div>
              <div className="mt-1 bg-white px-3 py-1 text-slate-950">
                {profile?.goal || "Pendiente"}
              </div>
            </section>
          </aside>

          <section className="bg-white">
            <div className="bg-sky-700 px-6 py-2 text-center text-lg font-bold uppercase text-white">
              Historia clinica
            </div>

            <div className="px-6 py-6 lg:px-16">
              <section>
                <h2 className="border-b-2 border-blue-800 pb-1 text-2xl uppercase text-blue-700">
                  Antecedentes de salud
                </h2>
                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_16rem]">
                  <dl className="grid gap-2 text-base">
                    <div className="grid grid-cols-[14rem_1fr] gap-4">
                      <dt>Motivo de consulta:</dt>
                      <dd className="bg-slate-50 px-3 py-1 text-center">{profile?.goal || "Pendiente"}</dd>
                    </div>
                    {["¿Padece alguna enfermedad?", "¿Toma medicamentos?", "Nombre / Dosis", "Consumo de alcohol", "Consumo de tabaco"].map(
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
                <div className="bg-sky-700 px-4 py-2 text-center text-lg font-bold uppercase text-white">
                  Antecedentes familiares
                </div>
                <div className="mt-8 overflow-hidden rounded-sm">
                  <div className="grid grid-cols-[1.5fr_repeat(3,0.42fr)] bg-slate-200 text-center text-lg uppercase">
                    <span className="py-2">Padecimientos</span>
                    <span className="py-2">Madre</span>
                    <span className="py-2">Padre</span>
                    <span className="py-2">Paciente</span>
                  </div>
                  {familyHistoryRows.map((row, index) => (
                    <div
                      className={`grid grid-cols-[1.5fr_repeat(3,0.42fr)] text-sm ${
                        index % 2 === 0 ? "bg-slate-100" : "bg-slate-200"
                      }`}
                      key={row}
                    >
                      <span className="px-2 py-2 font-semibold">{row}</span>
                      <span className="border-l border-white" />
                      <span className="border-l border-white" />
                      <span className="border-l border-white" />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-right text-sm font-semibold italic">Marcar (+) si lo padece.</p>
              </section>

              <section className="mt-12 grid gap-10 lg:grid-cols-2">
                <div>
                  <h2 className="border-b-2 border-blue-800 pb-1 text-2xl uppercase text-blue-700">
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
                  <h2 className="border-b-2 border-blue-800 pb-1 text-2xl uppercase text-blue-700">
                    Signos y sintomas
                  </h2>
                  <div className="mt-6">
                    <div className="text-center text-lg font-semibold">
                      Aspecto general
                    </div>
                    <div className="mt-2 min-h-28 bg-slate-200 p-3 text-sm">
                      Aspecto general normal
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-12">
                <div className="bg-sky-700 px-4 py-2 text-center text-lg font-bold uppercase text-white">
                  Analisis bioquimicos
                </div>
                <div className="mt-8 grid gap-5">
                  <div className="grid grid-cols-[1fr_0.55fr_1fr_1fr] gap-6 text-center text-lg font-semibold text-slate-500">
                    <span>Indicador</span>
                    <span>Valor</span>
                    <span>Valor de ref</span>
                    <span>Rango visual</span>
                  </div>
                  {biochemicalIndicators.map((indicator) => (
                    <div className="grid grid-cols-[1fr_0.55fr_1fr_1fr] items-center gap-6" key={indicator.label}>
                      <span className="text-right">{indicator.label}</span>
                      <span className="bg-blue-100 py-2 text-center">{indicator.value}</span>
                      <span className="bg-slate-200 py-2 text-center text-slate-600">{indicator.reference}</span>
                      <div>
                        <div className="h-6 border border-white bg-gradient-to-r from-sky-200 via-lime-200 to-red-300">
                          <div
                            className="h-full border-r-2 border-lime-500"
                            style={{ width: `${getIndicatorPercent(indicator.goodUntil, indicator.max)}%` }}
                          />
                        </div>
                        <div className="mt-1 flex justify-between text-xs text-slate-500">
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
                <div className="bg-sky-700 px-4 py-2 text-center text-lg font-bold uppercase text-white">
                  Comentarios generales
                </div>
                <div className="mx-auto mt-8 min-h-36 max-w-3xl bg-slate-200 p-3">
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
