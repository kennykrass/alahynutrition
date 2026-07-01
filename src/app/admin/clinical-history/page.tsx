import Link from "next/link";
import { UserRole } from "@prisma/client";

import {
  createClinicalDemoPatientAction,
  saveClinicalAnthropometryAction,
  saveClinicalFollowUpAction,
  saveClinicalFoodRecallAction,
  saveClinicalFormulasAction,
  saveClinicalHistoryAction,
  saveClinicalPatientSummaryAction,
  saveClinicalProgressAction
} from "@/app/auth-actions";
import {
  biochemicalIndicators,
  calculateAge,
  familyHistoryRows,
  getIndicatorPercent,
  gynecologicalRows
} from "@/lib/clinical-history";
import { ensureClinicalDemoPatient } from "@/lib/clinical-demo-patient";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

type ClinicalHistoryPageProps = {
  searchParams?: {
    patientId?: string;
    page?: string;
    success?: string;
    error?: string;
  };
};

type ClinicalNotes = {
  disease: string;
  medicationNameDose: string;
  alcohol: string;
  tobacco: string;
  generalCondition: string;
  comments: string;
  familyHistory: Record<
    string,
    {
      mother: boolean;
      father: boolean;
      patient: boolean;
    }
  >;
  gynecological: Record<string, string>;
  foodRecall: Record<
    string,
    Array<{
      name: string;
      quantity: string;
      unit: string;
    }>
  >;
  anthropometry: {
    date: string;
    circumferences: Record<string, { previous: string; current: string }>;
    skinfolds: Record<string, string>;
    diameters: Record<string, string>;
    composition: Record<string, string>;
  };
  formulas: {
    date: string;
    energy: Record<string, { tmb: string; af: string; eta: string }>;
    idealWeight: Record<string, { value: string; difference: string }>;
    complexion: Record<string, string>;
    somatotype: Record<string, string>;
  };
  followUp: {
    consultation: string;
    health: Record<string, string>;
    generalCondition: string;
    comments: string;
  };
  progress: {
    date: string;
    metrics: Record<string, string[]>;
  };
};

const clinicalPageNumbers = [1, 2, 3, 4, 5, 6];
const recallMeals = ["Desayuno", "Comida", "Cena"];
const recallMealKeys = ["breakfast", "lunch", "dinner"];
const macroRows = ["Kcal", "HCO", "PT", "LP"];
const circumferenceRows = [
  ["Cintura", "100"],
  ["Cadera", "105"],
  ["Muneca", "17"],
  ["Cabeza", ""],
  ["Brazo relajado", "29"],
  ["Brazo flexionado", "31"],
  ["Pantorrilla", ""]
];
const skinfoldRows = ["Bicipital*", "Tricipital*", "Subescapular*", "Suprailiaco*", "Muslo", "Abdominal", "Pecho", "Axilar", "Pierna"];
const diameterRows = ["Femur", "Humero", "Muneca"];
const compositionRows = [
  { label: "ICC", value: "0.95" },
  { label: "Interpretacion riesgo", value: "Ginecoide / Muy bajo" },
  { label: "% grasa c.", value: "Pendiente" },
  { label: "Interpretacion", value: "Acrecentada" },
  { label: "Masa muscular (kg)", value: "57.30" },
  { label: "Densidad c.", value: "Pendiente" },
  { label: "Masa grasa (kg)", value: "Pendiente" },
  { label: "Masa magra (kg)", value: "75.50" },
  { label: "Masa osea (kg)", value: "0.00" },
  { label: "Masa residual (kg)", value: "18.20" }
];
const energyFormulaRows = [
  { label: "Harris Benedict", tmb: "1710", af: "2352", eta: "2523" },
  { label: "Mifflin St.", tmb: "1625", af: "2235", eta: "2398" },
  { label: "Valencia", tmb: "1756", af: "2415", eta: "2591" },
  { label: "FAO/WHO/ONU", tmb: "1829", af: "2515", eta: "2698" }
];
const idealWeightRows = [
  { label: "Lorentz", value: "60 kg", difference: "16 kg" },
  { label: "Broca", value: "63 kg", difference: "13 kg" },
  { label: "Metropolitan Life Insurance Company", value: "60 kg", difference: "16 kg" }
];
const bodyComplexionRows = [
  { label: "Resultado", value: "17" },
  { label: "Interpretacion", value: "Pequena" },
  { label: "IMC", value: "28.4" },
  { label: "Interpretacion", value: "Sobre peso" }
];
const somatotypeRows = [
  { label: "Endomorfismo", value: "-0.7" },
  { label: "Mesomorfismo", value: "-11.4" },
  { label: "Ectomorfismo", value: "0.2" }
];
const followUpHealthRows = [
  "Motivo de consulta:",
  "Padece alguna enfermedad?",
  "Toma medicamentos?",
  "Nombre / Dosis",
  "Consumo de alcohol",
  "Consumo de tabaco"
];
const progressDates = ["15/03/20", "11/03/20", "14/02/20"];
const progressMetrics = [
  { label: "Peso", values: ["73", "75", "75"], color: "stroke-glow", text: "text-glow", band: "bg-glow/10" },
  { label: "Grasa", values: ["21", "23", "23"], color: "stroke-amber-300", text: "text-amber-200", band: "bg-amber-300/10" },
  { label: "Musculo", values: ["21", "20", "20"], color: "stroke-rose-300", text: "text-rose-200", band: "bg-rose-300/10" }
];

function buildClinicalPageHref(patientId: string | undefined, page: number) {
  const params = new URLSearchParams();

  if (patientId) {
    params.set("patientId", patientId);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return `/admin/clinical-history${query ? `?${query}` : ""}`;
}

function formatDateInput(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function getMeasurementDifference(previous: string, current: string) {
  const previousValue = Number(previous);
  const currentValue = Number(current);

  if (!previous.trim() || !current.trim() || !Number.isFinite(previousValue) || !Number.isFinite(currentValue)) {
    return "";
  }

  const difference = currentValue - previousValue;
  return difference > 0 ? `+${difference.toFixed(1)}` : difference.toFixed(1);
}

function EditableCell({
  name,
  defaultValue,
  placeholder
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <input
      className="min-h-7 w-full rounded-lg border border-mist/10 bg-white/5 px-3 py-1 text-center text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
      defaultValue={defaultValue ?? ""}
      name={name}
      placeholder={placeholder}
    />
  );
}

function parseClinicalNotes(notes?: string | null): ClinicalNotes {
  const fallback = {
    disease: "",
    medicationNameDose: "",
    alcohol: "",
    tobacco: "",
    generalCondition: "Aspecto general normal",
    comments: notes ?? "",
    familyHistory: {},
    gynecological: {},
    foodRecall: {},
    anthropometry: {
      date: "",
      circumferences: {},
      skinfolds: {},
      diameters: {},
      composition: {}
    },
    formulas: { date: "", energy: {}, idealWeight: {}, complexion: {}, somatotype: {} },
    followUp: { consultation: "", health: {}, generalCondition: "Aspecto general normal", comments: "" },
    progress: { date: "", metrics: {} }
  };

  if (!notes) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(notes) as Partial<ClinicalNotes>;

    return {
      disease: parsed.disease ?? "",
      medicationNameDose: parsed.medicationNameDose ?? "",
      alcohol: parsed.alcohol ?? "",
      tobacco: parsed.tobacco ?? "",
      generalCondition: parsed.generalCondition ?? "Aspecto general normal",
      comments: parsed.comments ?? "",
      familyHistory: parsed.familyHistory ?? {},
      gynecological: parsed.gynecological ?? {},
      foodRecall: parsed.foodRecall ?? {},
      anthropometry: parsed.anthropometry ?? {
        date: "",
        circumferences: {},
        skinfolds: {},
        diameters: {},
        composition: {}
      },
      formulas: parsed.formulas ?? { date: "", energy: {}, idealWeight: {}, complexion: {}, somatotype: {} },
      followUp: parsed.followUp ?? { consultation: "", health: {}, generalCondition: "Aspecto general normal", comments: "" },
      progress: parsed.progress ?? { date: "", metrics: {} }
    };
  } catch {
    return fallback;
  }
}

function ProgressChart({
  metrics,
  height = "h-40"
}: {
  metrics: typeof progressMetrics;
  height?: string;
}) {
  return (
    <div className={`relative ${height} rounded-2xl border border-mist/10 bg-white/5 p-4`}>
      <div className="absolute inset-x-14 top-8 bottom-10 bg-[linear-gradient(0deg,rgba(255,255,255,0.10)_1px,transparent_1px)] bg-[length:100%_33.33%]" />
      <div className="absolute left-4 top-7 bottom-10 flex flex-col justify-between text-[0.65rem] text-[color:var(--text-soft)]">
        <span>105</span>
        <span>55</span>
        <span>5</span>
      </div>
      <svg className="absolute inset-x-12 top-7 bottom-10 h-[calc(100%-4.25rem)] w-[calc(100%-6rem)] overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
        {metrics.map((metric) => (
          <polyline
            className={`${metric.color} fill-none`}
            key={metric.label}
            points={metric.label === "Peso" ? "0,42 90,38 150,30 205,112" : metric.label === "Grasa" ? "0,92 90,88 150,84 205,118" : "0,96 90,94 150,98 205,120"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="absolute inset-x-12 top-3 grid grid-cols-3 text-center text-xs font-bold">
        {metrics[0].values.map((value, index) => (
          <span className={metrics[0].text} key={`${value}-${index}`}>{value}</span>
        ))}
      </div>
      {metrics.length > 1 ? (
        <div className="absolute inset-x-12 top-[42%] grid grid-cols-3 text-center text-xs font-bold">
          {metrics[1].values.map((value, index) => (
            <span className={metrics[1].text} key={`${value}-${index}`}>{value}</span>
          ))}
        </div>
      ) : null}
      {metrics.length > 2 ? (
        <div className="absolute inset-x-12 top-[58%] grid grid-cols-3 text-center text-xs font-bold">
          {metrics[2].values.map((value, index) => (
            <span className={metrics[2].text} key={`${value}-${index}`}>{value}</span>
          ))}
        </div>
      ) : null}
      <div className="absolute inset-x-12 bottom-2 grid grid-cols-3 text-center text-[0.65rem] text-[color:var(--text-soft)]">
        {progressDates.map((date) => (
          <span className="-rotate-12" key={date}>{date}</span>
        ))}
      </div>
    </div>
  );
}

export default async function ClinicalHistoryPage({ searchParams }: ClinicalHistoryPageProps) {
  await requireRole(UserRole.ADMIN);
  await ensureClinicalDemoPatient();

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
  const clinicalNotes = parseClinicalNotes(profile?.notes);
  const requestedPage = Number(searchParams?.page ?? 1);
  const selectedPage = clinicalPageNumbers.includes(requestedPage) ? requestedPage : 1;
  const progressMetricKeys = ["weight", "fat", "muscle"];
  const resolvedProgressMetrics = progressMetrics.map((metric, index) => ({
    ...metric,
    values: clinicalNotes.progress.metrics[progressMetricKeys[index]] ?? metric.values
  }));

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
          <div className="flex items-center justify-center px-6 py-5">
            <div className="flex items-center gap-2 rounded-full border border-mist/15 bg-ink/70 px-4 py-2 text-sm text-[color:var(--text-soft)]">
              <span>Pagina</span>
              {clinicalPageNumbers.map((page) => (
                <Link
                  className={`grid h-8 w-8 place-items-center rounded-lg border text-sm font-bold transition ${
                    selectedPage === page
                      ? "border-glow bg-glow text-ink shadow-glow"
                      : "border-mist/15 bg-white/5 text-glow hover:border-glow/60"
                  }`}
                  href={buildClinicalPageHref(selectedPatient?.id, page)}
                  key={page}
                >
                  {page}
                </Link>
              ))}
              {selectedPage === 5 ? (
                <>
                  <span className="ml-3 rounded-lg border border-rose-300/40 bg-rose-500/90 px-5 py-2 text-xs font-bold uppercase text-white shadow-lg shadow-rose-950/30">
                    Eliminar registro
                  </span>
                  <span className="rounded-lg border border-glow/30 bg-white px-5 py-2 text-xs font-bold uppercase text-ink shadow-glow">
                    Iniciar
                  </span>
                </>
              ) : (
                <span className="ml-3 rounded-lg border border-glow/30 bg-white/5 px-5 py-2 text-xs font-bold uppercase text-white">
                  Registrar
                </span>
              )}
              <span className="grid h-9 w-9 place-items-center rounded-full border border-glow/40 bg-steel text-lg font-bold text-glow">
                ?
              </span>
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-[21rem_1fr]">
          <aside className="border-r border-mist/15 bg-ink/80">
            <form className="border-b border-mist/15 p-6">
              <input name="page" type="hidden" value={selectedPage} />
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

            <form action={createClinicalDemoPatientAction} className="border-b border-mist/15 px-6 py-4">
              <button
                className="w-full rounded-xl border border-glow/30 bg-white/5 px-4 py-3 text-sm font-bold text-glow transition hover:border-glow hover:bg-glow/10"
                type="submit"
              >
                Crear paciente demo
              </button>
              <p className="mt-2 text-xs text-[color:var(--text-soft)]">
                Usa datos mock para probar la historia clinica.
              </p>
            </form>

            <form action={saveClinicalPatientSummaryAction} className="text-center">
              <input name="userId" type="hidden" value={selectedPatient?.id ?? ""} />
              <input name="page" type="hidden" value={selectedPage} />
              <section className="p-6">
              <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border-4 border-glow/50 bg-steel text-5xl text-white shadow-glow">
                {selectedPatient?.fullName?.charAt(0) ?? "P"}
              </div>

              <div className="mt-6 border-y border-mist/20 py-2 text-lg font-bold uppercase text-white">
                Ficha tecnica
              </div>

              <dl className="mt-4 grid gap-2 text-sm">
                <div>
                  <dt className="font-bold uppercase text-[color:var(--text-soft)]">Nombre</dt>
                  <dd>
                    <input
                      className="mt-1 w-full rounded-lg border border-glow/20 bg-glow/10 px-3 py-2 text-center text-lg font-semibold text-glow outline-none transition focus:border-glow"
                      defaultValue={selectedPatient?.fullName ?? ""}
                      name="fullName"
                      placeholder="Nombre del paciente"
                      required
                    />
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-[color:var(--text-soft)]">Sexo</dt>
                  <dd>
                    <select
                      className="mt-1 w-full rounded-lg border border-mist/10 bg-ink/80 px-3 py-2 text-center text-white outline-none transition focus:border-glow"
                      defaultValue={profile?.biologicalSex ?? ""}
                      name="biologicalSex"
                      required
                    >
                      <option disabled value="">Seleccionar</option>
                      <option value="MALE">Masculino</option>
                      <option value="FEMALE">Femenino</option>
                    </select>
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-[color:var(--text-soft)]">Talla (m)</dt>
                  <dd>
                    <input
                      className="mt-1 w-full rounded-lg border border-mist/10 bg-white/5 px-3 py-2 text-center text-white outline-none transition focus:border-glow"
                      defaultValue={profile?.heightCm ? (profile.heightCm / 100).toFixed(2) : ""}
                      max="2.5"
                      min="1"
                      name="heightM"
                      required
                      step="0.01"
                      type="number"
                    />
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase text-[color:var(--text-soft)]">Edad</dt>
                  <dd>
                    <input
                      className="mt-1 w-full rounded-lg border border-mist/10 bg-white/5 px-3 py-2 text-center text-white outline-none transition focus:border-glow"
                      defaultValue={age ?? ""}
                      max="120"
                      min="10"
                      name="age"
                      required
                      type="number"
                    />
                  </dd>
                </div>
              </dl>
              </section>

              <section className="border-t border-mist/15 bg-steel/50 px-6 py-5 text-white">
                <label className="block font-bold uppercase">
                  Fecha de registro
                  <input
                    className="mt-1 w-full rounded-lg border border-mist/10 bg-white/10 px-3 py-2 text-center text-white outline-none transition focus:border-glow"
                    defaultValue={formatDateInput(selectedPatient?.createdAt)}
                    name="registrationDate"
                    required
                    type="date"
                  />
                </label>
                <label className="mt-3 block font-bold uppercase">
                  Peso (kg)
                  <input
                    className="mt-1 w-full rounded-lg border border-mist/10 bg-white/10 px-3 py-2 text-center text-white outline-none transition focus:border-glow"
                    defaultValue={lastEntry?.weightKg ?? profile?.currentWeightKg ?? ""}
                    max="400"
                    min="20"
                    name="weightKg"
                    required
                    step="0.1"
                    type="number"
                  />
                </label>
                <label className="mt-3 block font-bold uppercase">
                  Nivel de act. fisica
                  <select
                    className="mt-1 w-full rounded-lg border border-mist/10 bg-ink/80 px-3 py-2 text-center text-white outline-none transition focus:border-glow"
                    defaultValue={profile?.physicalActivityLevel ?? ""}
                    name="physicalActivityLevel"
                    required
                  >
                    <option disabled value="">Seleccionar</option>
                    <option value="NONE">Ninguna</option>
                    <option value="LIGHT">Ligera</option>
                    <option value="MODERATE">Moderada</option>
                    <option value="INTENSE">Intensa</option>
                  </select>
                </label>
                <label className="mt-3 block font-bold uppercase">
                  Objetivo
                  <input
                    className="mt-1 w-full rounded-lg border border-mist/10 bg-white/10 px-3 py-2 text-center font-normal normal-case text-white outline-none transition focus:border-glow"
                    defaultValue={profile?.goal ?? ""}
                    name="goal"
                    placeholder="Objetivo del paciente"
                  />
                </label>
                <button
                  className="mt-5 w-full rounded-xl bg-glow px-4 py-3 text-sm font-bold text-ink shadow-glow transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!selectedPatient}
                  type="submit"
                >
                  Guardar ficha tecnica
                </button>
              </section>
            </form>
          </aside>

          <section className="bg-ink/55">
            {searchParams?.success ? (
              <div className="border-b border-emerald-300/20 bg-emerald-300/10 px-6 py-3 text-center text-sm text-emerald-100">
                {searchParams.success}
              </div>
            ) : null}
            {searchParams?.error ? (
              <div className="border-b border-rose-300/20 bg-rose-500/10 px-6 py-3 text-center text-sm text-rose-100">
                {searchParams.error}
              </div>
            ) : null}
            <div className="bg-steel px-6 py-2 text-center text-lg font-bold uppercase text-white">
              {selectedPage === 2
                ? "Recordatorio 24 horas"
                : selectedPage === 3
                  ? "Antropometria"
                  : selectedPage === 4
                    ? "Formulas"
                    : selectedPage === 5
                      ? "Consulta de seguimiento"
                      : selectedPage === 6
                        ? "Resumen de progreso"
                    : "Historia clinica"}
            </div>

            {selectedPage === 2 ? (
              <div className="grid lg:grid-cols-[1fr_1.06fr]">
                <form action={saveClinicalFoodRecallAction} className="border-b border-mist/15 px-6 py-6 lg:border-b-0 lg:border-r lg:px-12">
                  <input name="userId" type="hidden" value={selectedPatient?.id ?? ""} />
                  <div className="rounded-2xl bg-steel px-4 py-2 text-center text-sm font-bold uppercase tracking-wide text-white">
                    Recordatorio 24 horas
                  </div>

                  <div className="mt-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-glow/60 pb-2">
                      <h2 className="text-lg uppercase text-glow">Alimentos consumidos</h2>
                      <button
                        className="rounded-xl bg-glow px-4 py-2 text-xs font-bold text-ink shadow-glow transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!selectedPatient}
                        type="submit"
                      >
                        Guardar recordatorio
                      </button>
                    </div>
                    {recallMeals.map((meal, mealIndex) => (
                      <div className="mt-5" key={meal}>
                        <div className="text-right text-sm font-semibold text-[color:var(--text-soft)]">{meal}</div>
                        <div className="grid grid-cols-[1.25fr_0.7fr_0.85fr] border-b border-glow/60 pb-1 text-center text-xs uppercase tracking-wide text-[color:var(--text-soft)]">
                          <span>Nombre</span>
                          <span>Cantidad</span>
                          <span>U. medida</span>
                        </div>
                        <div className="mt-1 grid gap-1">
                          {Array.from({ length: 6 }).map((_, rowIndex) => {
                            const mealKey = recallMealKeys[mealIndex];
                            const entry = clinicalNotes.foodRecall[mealKey]?.[rowIndex];

                            return (
                              <div
                                className={`grid min-h-10 grid-cols-[1.25fr_0.7fr_0.85fr] overflow-hidden rounded-lg border border-mist/10 ${
                                  rowIndex % 2 === 0 ? "bg-white/5" : "bg-white/10"
                                }`}
                                key={rowIndex}
                              >
                              <input
                                aria-label={`${meal} alimento ${rowIndex + 1}`}
                                className="min-w-0 bg-transparent px-3 py-2 text-white outline-none focus:bg-glow/10"
                                defaultValue={entry?.name ?? ""}
                                name={`foodRecall_${mealKey}_${rowIndex}_name`}
                              />
                              <input
                                aria-label={`${meal} cantidad ${rowIndex + 1}`}
                                className="min-w-0 border-l border-mist/10 bg-transparent px-2 py-2 text-center text-white outline-none focus:bg-glow/10"
                                defaultValue={entry?.quantity ?? ""}
                                name={`foodRecall_${mealKey}_${rowIndex}_quantity`}
                              />
                              <input
                                aria-label={`${meal} unidad ${rowIndex + 1}`}
                                className="min-w-0 border-l border-mist/10 bg-transparent px-2 py-2 text-center text-white outline-none focus:bg-glow/10"
                                defaultValue={entry?.unit ?? ""}
                                name={`foodRecall_${mealKey}_${rowIndex}_unit`}
                              />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </form>

                <section className="px-6 py-6 lg:px-12">
                  <div className="rounded-2xl bg-steel px-4 py-2 text-center text-sm font-bold uppercase tracking-wide text-white">
                    Resultados
                  </div>

                  <div className="mt-5">
                    <h2 className="border-b-2 border-glow/60 pb-1 text-lg uppercase text-glow">Total dia</h2>
                    <div className="grid grid-cols-8 rounded-b-xl border border-t-0 border-mist/10 bg-white/5 py-2 text-center text-xs uppercase">
                      <span className="font-bold">Kcal</span>
                      <span>0</span>
                      <span className="font-bold">HCO</span>
                      <span>0</span>
                      <span className="font-bold">PT</span>
                      <span>0</span>
                      <span className="font-bold">LP</span>
                      <span>0</span>
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl border border-mist/10 bg-white/5 p-5">
                    <div className="grid min-h-72 grid-cols-[3rem_1fr] gap-3">
                      <div className="flex items-center justify-center text-xs font-semibold uppercase text-[color:var(--text-soft)]">
                        Kcal
                      </div>
                      <div className="relative border-l border-b border-mist/30 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:10%_100%]">
                        <div className="absolute inset-x-0 bottom-[-1.75rem] grid grid-cols-11 text-center text-xs text-[color:var(--text-soft)]">
                          {Array.from({ length: 11 }).map((_, index) => (
                            <span key={index}>{index / 10}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-10 flex justify-center gap-4 text-xs text-[color:var(--text-soft)]">
                      <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-glow" />HCO</span>
                      <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sky-200" />PT</span>
                      <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-300" />Lipidos</span>
                    </div>
                  </div>

                  <div className="mt-10">
                    <h2 className="border-b-2 border-glow/60 pb-1 text-lg uppercase text-glow">
                      Total por tiempo de comida
                    </h2>
                    <div className="grid grid-cols-3 text-sm text-[color:var(--text-soft)]">
                      {recallMeals.map((meal) => (
                        <div className="border-r border-mist/10 last:border-r-0" key={meal}>
                          <div className="bg-white/10 px-2 py-1 font-semibold text-glow">{meal}</div>
                          {macroRows.map((row, index) => (
                            <div
                              className={`grid grid-cols-2 px-2 py-1 ${
                                index % 2 === 0 ? "bg-white/5" : "bg-white/10"
                              }`}
                              key={row}
                            >
                              <span>{row}</span>
                              <span className="text-center">0</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            ) : selectedPage === 3 ? (
              <form action={saveClinicalAnthropometryAction} className="grid min-w-0">
                <input name="userId" type="hidden" value={selectedPatient?.id ?? ""} />
                <section className="min-w-0 border-b border-mist/15 px-6 py-6 lg:px-12">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-steel px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">
                    <span>Antropometria</span>
                    <button
                      className="rounded-xl bg-glow px-4 py-2 text-xs font-bold text-ink shadow-glow transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!selectedPatient}
                      type="submit"
                    >
                      Guardar antropometria
                    </button>
                  </div>

                  <div className="mt-5">
                    <div className="grid items-end gap-4 sm:grid-cols-[1fr_13rem]">
                      <h2 className="border-b-2 border-glow/60 pb-1 text-lg uppercase text-glow">
                        Circunferencias (cm)
                      </h2>
                      <input
                        className="rounded-t-xl border border-glow/20 bg-glow/10 px-3 py-2 text-center text-sm font-semibold text-glow outline-none focus:border-glow"
                        defaultValue={clinicalNotes.anthropometry.date || "2022-03-11"}
                        name="anthropometryDate"
                        type="date"
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-[1fr_4rem_4rem_4rem] text-center text-xs uppercase tracking-wide text-[color:var(--text-soft)]">
                      <span />
                      <span>Antes</span>
                      <span>Actual</span>
                      <span>Dif.</span>
                    </div>
                    <div className="mt-1 overflow-hidden rounded-xl border border-mist/10">
                      {circumferenceRows.map(([label, value], index) => {
                        const measurement = clinicalNotes.anthropometry.circumferences[String(index)];
                        const previous = measurement?.previous ?? "";
                        const current = measurement?.current ?? value;

                        return (
                          <div
                            className={`grid grid-cols-[1fr_4rem_4rem_4rem] text-sm ${
                              index % 2 === 0 ? "bg-white/5" : "bg-white/10"
                            }`}
                            key={label}
                          >
                            <span className="px-3 py-2 font-medium">{label}</span>
                            <input
                              className="min-w-0 border-l border-mist/10 bg-transparent px-2 py-2 text-center text-white outline-none focus:bg-glow/10"
                              defaultValue={previous}
                              name={`circumference_${index}_previous`}
                            />
                            <input
                              className="min-w-0 border-l border-mist/10 bg-transparent px-2 py-2 text-center text-white outline-none focus:bg-glow/10"
                              defaultValue={current}
                              name={`circumference_${index}_current`}
                            />
                            <span className="border-l border-mist/10 px-2 py-2 text-center text-[color:var(--text-soft)]">
                              {getMeasurementDifference(previous, current)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-8">
                    <h2 className="border-b-2 border-glow/60 pb-1 text-lg uppercase text-glow">
                      Pliegues (mm)
                    </h2>
                    <div className="mt-4 overflow-hidden rounded-xl border border-mist/10">
                      {skinfoldRows.map((row, index) => (
                        <div
                          className={`grid grid-cols-[1fr_13rem] text-sm ${
                            index % 2 === 0 ? "bg-white/5" : "bg-white/10"
                          }`}
                          key={row}
                        >
                          <span className="px-3 py-2 font-medium">{row}</span>
                          <input
                            className="min-w-0 border-l border-mist/10 bg-transparent px-3 py-2 text-center text-white outline-none focus:bg-glow/10"
                            defaultValue={clinicalNotes.anthropometry.skinfolds[String(index)] ?? ""}
                            name={`skinfold_${index}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8">
                    <h2 className="border-b-2 border-glow/60 pb-1 text-lg uppercase text-glow">
                      Diametros (cm)
                    </h2>
                    <div className="mt-4 overflow-hidden rounded-xl border border-mist/10">
                      {diameterRows.map((row, index) => (
                        <div
                          className={`grid grid-cols-[1fr_13rem] text-sm ${
                            index % 2 === 0 ? "bg-white/5" : "bg-white/10"
                          }`}
                          key={row}
                        >
                          <span className="px-3 py-2 font-medium">{row}</span>
                          <input
                            className="min-w-0 border-l border-mist/10 bg-transparent px-3 py-2 text-center text-white outline-none focus:bg-glow/10"
                            defaultValue={clinicalNotes.anthropometry.diameters[String(index)] ?? ""}
                            name={`diameter_${index}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="min-w-0 px-6 py-6 lg:px-12">
                  <div className="rounded-2xl bg-steel px-4 py-2 text-center text-sm font-bold uppercase tracking-wide text-white break-words">
                    Resultados de antropometria
                  </div>

                  <div className="mt-5">
                    <h2 className="border-b-2 border-glow/60 pb-1 text-lg uppercase text-glow">
                      Composicion corporal
                    </h2>
                    <div className="mt-6 grid min-w-0 gap-8 lg:grid-cols-[minmax(16rem,0.78fr)_minmax(20rem,1fr)]">
                      <div className="flex min-h-[32rem] min-w-0 items-center justify-center rounded-3xl border border-mist/10 bg-white/5 p-6">
                        <div className="relative h-[28rem] w-48 opacity-90">
                          <div className="absolute left-1/2 top-0 h-16 w-14 -translate-x-1/2 rounded-full bg-glow/35" />
                          <div className="absolute left-1/2 top-14 h-40 w-24 -translate-x-1/2 rounded-[45%] bg-glow/35" />
                          <div className="absolute left-[1.15rem] top-16 h-40 w-10 rotate-[13deg] rounded-full bg-glow/30" />
                          <div className="absolute right-[1.15rem] top-16 h-40 w-10 -rotate-[13deg] rounded-full bg-glow/30" />
                          <div className="absolute left-[4.3rem] top-48 h-44 w-10 rounded-full bg-glow/35" />
                          <div className="absolute right-[4.3rem] top-48 h-44 w-10 rounded-full bg-glow/35" />
                          <div className="absolute left-[4.1rem] bottom-0 h-9 w-11 rounded-full bg-glow/30" />
                          <div className="absolute right-[4.1rem] bottom-0 h-9 w-11 rounded-full bg-glow/30" />
                          <div className="absolute left-1/2 top-[11.5rem] h-16 w-px -translate-x-1/2 bg-ink/30" />
                          <div className="absolute left-[4.5rem] top-[18rem] h-8 w-px rotate-12 bg-ink/20" />
                          <div className="absolute right-[4.5rem] top-[18rem] h-8 w-px -rotate-12 bg-ink/20" />
                          <div className="absolute bottom-[-5.5rem] left-1/2 h-24 w-36 -translate-x-1/2 rounded-[50%] bg-glow/10 blur-sm" />
                        </div>
                      </div>

                      <div className="grid min-w-0 content-start gap-4">
                        <div className="grid gap-2">
                          {compositionRows.map((row, index) => (
                            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(7rem,8.5rem)] items-center gap-3 text-sm" key={`${row.label}-${index}`}>
                              <label className="min-w-0 break-words text-right font-semibold uppercase text-white" htmlFor={`composition_${index}`}>{row.label}</label>
                              <input
                                className="min-h-10 min-w-0 rounded-xl border border-mist/10 bg-white/5 px-3 py-2 text-center text-white outline-none focus:border-glow"
                                defaultValue={clinicalNotes.anthropometry.composition[String(index)] ?? row.value}
                                id={`composition_${index}`}
                                name={`composition_${index}`}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {["ICC", "Grasa", "Musculo", "Residual"].map((label, index) => (
                            <div
                              className={`grid aspect-square place-items-center rounded-2xl border text-xs font-bold uppercase ${
                                index === 0
                                  ? "border-glow/60 bg-glow/10 text-glow"
                                  : index === 1
                                    ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                                    : index === 2
                                      ? "border-sky-300/40 bg-sky-300/10 text-sky-100"
                                      : "border-mist/20 bg-white/5 text-[color:var(--text-soft)]"
                              }`}
                              key={label}
                            >
                              {label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </form>
            ) : selectedPage === 4 ? (
              <form action={saveClinicalFormulasAction} className="grid xl:grid-cols-[1fr_1.22fr]">
                <input name="userId" type="hidden" value={selectedPatient?.id ?? ""} />
                <section className="border-b border-mist/15 px-6 py-6 lg:border-b-0 lg:border-r lg:px-12">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-steel px-4 py-2 text-sm font-bold uppercase tracking-wide text-white">
                    <span>Formulas</span>
                    <button className="rounded-xl bg-glow px-4 py-2 text-xs text-ink shadow-glow disabled:opacity-50" disabled={!selectedPatient} type="submit">Guardar pagina 4</button>
                  </div>

                  <div className="mt-5">
                    <h2 className="border-b-2 border-glow/60 pb-1 text-lg uppercase text-glow">Gasto energetico</h2>
                    <div className="mt-3 grid grid-cols-[1fr_4rem_4rem_4rem] text-center text-xs uppercase text-[color:var(--text-soft)]">
                      <span />
                      <span>TMB</span>
                      <span>+AF</span>
                      <span>+ETA</span>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-mist/10">
                      {energyFormulaRows.map((row, index) => (
                        <div
                          className={`grid grid-cols-[1fr_4rem_4rem_4rem] text-sm ${
                            index % 2 === 0 ? "bg-white/5" : "bg-white/10"
                          }`}
                          key={row.label}
                        >
                          <span className="px-3 py-2 font-medium">{row.label}</span>
                          {(["tmb", "af", "eta"] as const).map((key) => (
                            <input className="min-w-0 border-l border-mist/10 bg-transparent px-1 py-2 text-center outline-none focus:bg-glow/10" defaultValue={clinicalNotes.formulas.energy[String(index)]?.[key] ?? row[key]} key={key} name={`energy_${index}_${key}`} />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-14">
                    <h2 className="border-b-2 border-glow/60 pb-1 text-lg uppercase text-glow">Peso ideal</h2>
                    <div className="mt-3 overflow-hidden rounded-xl border border-mist/10">
                      <div className="grid grid-cols-[1fr_6rem_6rem] bg-white/10 text-center text-xs uppercase text-[color:var(--text-soft)]">
                        <span />
                        <span className="py-2">Peso</span>
                        <span className="py-2">Diferencia</span>
                      </div>
                      {idealWeightRows.map((row, index) => (
                        <div
                          className={`grid grid-cols-[1fr_6rem_6rem] text-sm ${
                            index % 2 === 0 ? "bg-white/5" : "bg-white/10"
                          }`}
                          key={row.label}
                        >
                          <span className="px-3 py-2 font-medium">{row.label}</span>
                          <input className="min-w-0 border-l border-mist/10 bg-transparent px-1 py-2 text-center outline-none focus:bg-glow/10" defaultValue={clinicalNotes.formulas.idealWeight[String(index)]?.value ?? row.value} name={`idealWeight_${index}_value`} />
                          <input className="min-w-0 border-l border-mist/10 bg-transparent px-1 py-2 text-center text-rose-200 outline-none focus:bg-glow/10" defaultValue={clinicalNotes.formulas.idealWeight[String(index)]?.difference ?? row.difference} name={`idealWeight_${index}_difference`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-10">
                    <h2 className="border-b-2 border-glow/60 pb-1 text-lg uppercase text-glow">Complexion corporal</h2>
                    <div className="mt-3 overflow-hidden rounded-xl border border-mist/10">
                      {bodyComplexionRows.map((row, index) => (
                        <div
                          className={`grid grid-cols-[1fr_10rem] text-sm ${
                            index % 2 === 0 ? "bg-white/5" : "bg-white/10"
                          }`}
                          key={`${row.label}-${index}`}
                        >
                          <span className="px-3 py-2 font-medium">{row.label}</span>
                          <input className="min-w-0 border-l border-mist/10 bg-transparent px-2 py-2 text-center outline-none focus:bg-glow/10" defaultValue={clinicalNotes.formulas.complexion[String(index)] ?? row.value} name={`complexion_${index}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="px-6 py-6 lg:px-12">
                  <div className="rounded-2xl bg-steel px-4 py-2 text-center text-sm font-bold uppercase tracking-wide text-white">
                    Resultados de antropometria
                  </div>

                  <div className="mt-5">
                    <div className="grid items-end gap-4 sm:grid-cols-[1fr_11rem]">
                      <h2 className="border-b-2 border-glow/60 pb-1 text-lg uppercase text-glow">Somatocarta</h2>
                      <input className="rounded-t-xl border border-glow/20 bg-glow/10 px-3 py-2 text-center text-sm font-semibold text-glow outline-none" defaultValue={clinicalNotes.formulas.date || "2022-03-11"} name="formulasDate" type="date" />
                    </div>

                    <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-xl border border-mist/10 text-center">
                      {somatotypeRows.map((row, index) => (
                        <div className="border-r border-mist/10 last:border-r-0" key={row.label}>
                          <div className="bg-white/10 px-2 py-2 text-xs uppercase tracking-wide text-[color:var(--text-soft)]">{row.label}</div>
                          <input className="w-full min-w-0 bg-white/5 px-2 py-2 text-center text-sm font-semibold text-white outline-none focus:bg-glow/10" defaultValue={clinicalNotes.formulas.somatotype[String(index)] ?? row.value} name={`somatotype_${index}`} />
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 rounded-3xl border border-mist/10 bg-white/5 p-4 sm:p-8">
                      <div className="relative mx-auto aspect-square max-w-[31rem] overflow-hidden rounded-2xl border border-mist/10 bg-ink/50">
                        <div className="absolute inset-8 bg-[linear-gradient(90deg,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.10)_1px,transparent_1px)] bg-[length:7.14%_7.14%]" />
                        <div className="absolute left-1/2 top-8 bottom-8 w-px -translate-x-1/2 bg-mist/40" />
                        <div className="absolute left-8 right-8 top-1/2 h-px -translate-y-1/2 bg-mist/40" />
                        <div className="absolute left-[18%] right-[18%] top-[14%] h-[72%] rounded-[50%] border border-glow/35" />
                        <div className="absolute left-[16%] right-[16%] top-[16%] h-px origin-left rotate-[31deg] bg-mist/50" />
                        <div className="absolute left-[16%] right-[16%] bottom-[18%] h-px origin-left -rotate-[31deg] bg-mist/50" />
                        <div className="absolute left-[16%] right-[16%] top-[50%] h-px origin-left rotate-[-31deg] bg-mist/50" />
                        <div className="absolute left-[16%] right-[16%] top-[50%] h-px origin-right rotate-[31deg] bg-mist/50" />
                        <div className="absolute left-1/2 top-1/2 grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md border border-glow bg-glow text-ink shadow-glow">
                          <span className="h-2 w-2 rounded-full bg-ink" />
                        </div>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold uppercase text-[color:var(--text-soft)]">X</div>
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold uppercase text-[color:var(--text-soft)]">Y</div>
                        <div className="absolute inset-y-8 left-1 grid grid-rows-[repeat(15,minmax(0,1fr))] text-right text-[0.62rem] text-[color:var(--text-soft)]">
                          {Array.from({ length: 15 }).map((_, index) => (
                            <span key={index}>{14 - index * 2}</span>
                          ))}
                        </div>
                        <div className="absolute inset-x-8 bottom-5 grid grid-cols-[repeat(15,minmax(0,1fr))] text-center text-[0.62rem] text-[color:var(--text-soft)]">
                          {Array.from({ length: 15 }).map((_, index) => (
                            <span key={index}>{-14 + index * 2}</span>
                          ))}
                        </div>
                      </div>

                      <div className="mx-auto mt-6 max-w-xl overflow-hidden rounded-xl border border-mist/10 text-sm">
                        <div className="grid grid-cols-[6rem_1fr_1fr_2rem] bg-steel text-center font-bold uppercase text-white">
                          <span className="py-2">Actual</span>
                          <span className="py-2 text-glow">Eje X</span>
                          <span className="py-2 text-glow">Eje Y</span>
                          <span className="py-2" />
                        </div>
                        <div className="grid grid-cols-[6rem_1fr_1fr_2rem] bg-white/5 text-center">
                          <span className="py-2 font-semibold">Anterior</span>
                          <span className="border-l border-mist/10 py-2">0.97618</span>
                          <span className="border-l border-mist/10 py-2">-22.279</span>
                          <span className="grid place-items-center border-l border-mist/10"><i className="h-3 w-3 rounded-full bg-glow" /></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </form>
            ) : selectedPage === 5 ? (
              <form action={saveClinicalFollowUpAction} className="px-6 py-7 lg:px-14">
                <input name="userId" type="hidden" value={selectedPatient?.id ?? ""} />
                <section>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-glow/60 pb-2">
                    <h2 className="text-lg uppercase text-glow">Consulta de seguimiento</h2>
                    <button className="rounded-xl bg-glow px-4 py-2 text-sm font-bold text-ink shadow-glow disabled:opacity-50" disabled={!selectedPatient} type="submit">Guardar pagina 5</button>
                  </div>
                  <textarea className="mx-auto mt-8 block min-h-24 w-full max-w-3xl rounded-xl border border-glow/20 bg-glow/10 p-3 text-white outline-none focus:border-glow" defaultValue={clinicalNotes.followUp.consultation} name="followUpConsultation" placeholder="Notas de la consulta de seguimiento" />
                </section>

                <section className="mt-12">
                  <div className="rounded-2xl bg-steel px-4 py-2 text-center text-sm font-bold uppercase tracking-wide text-white">
                    Informacion obtenida en ultima consulta
                  </div>

                  <div className="mt-8 grid gap-10 xl:grid-cols-[1fr_1fr]">
                    <div>
                      <h3 className="border-b-2 border-glow/60 pb-1 text-lg uppercase text-glow">
                        Antecedentes de salud
                      </h3>
                      <div className="mt-5 grid gap-2">
                        {followUpHealthRows.map((row, index) => (
                          <div className="grid gap-2 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(12rem,1fr)]" key={row}>
                            <span>{row}</span>
                            <input className="min-h-9 min-w-0 rounded-lg border border-mist/10 bg-white/5 px-3 text-white outline-none focus:border-glow" defaultValue={clinicalNotes.followUp.health[String(index)] ?? ""} name={`followUpHealth_${index}`} />
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 overflow-hidden rounded-xl border border-mist/10">
                        <div className="grid grid-cols-[1.5fr_repeat(3,0.42fr)] bg-white/10 text-center text-sm uppercase text-glow">
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
                            <span className="px-2 py-2 font-medium">{row}</span>
                            {(["mother", "father", "patient"] as const).map((relative) => <span className="grid place-items-center border-l border-mist/10" key={relative}>{clinicalNotes.familyHistory[row]?.[relative] ? "+" : ""}</span>)}
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-right text-xs font-semibold italic text-[color:var(--text-soft)]">
                        Marcar (+) si lo padece.
                      </p>
                    </div>

                    <div className="grid content-start gap-9">
                      <section>
                        <div className="text-center text-sm font-semibold">
                          Aspecto general (cabello, ojos, piel, unas, labios, encias, etc.).
                        </div>
                        <textarea className="mt-2 min-h-32 w-full rounded-2xl border border-mist/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-glow" defaultValue={clinicalNotes.followUp.generalCondition} name="followUpGeneralCondition" />
                      </section>

                      <section>
                        <div className="text-center text-sm font-semibold">Comentarios generales</div>
                        <textarea className="mt-2 min-h-36 w-full rounded-2xl border border-mist/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-glow" defaultValue={clinicalNotes.followUp.comments || clinicalNotes.comments} name="followUpComments" />
                      </section>
                    </div>
                  </div>
                </section>
              </form>
            ) : selectedPage === 6 ? (
              <form action={saveClinicalProgressAction} className="grid min-h-[42rem] xl:grid-cols-[1.08fr_1fr]">
                <input name="userId" type="hidden" value={selectedPatient?.id ?? ""} />
                <section className="border-b border-mist/15 p-6 xl:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold uppercase text-glow">Datos de progreso</h2>
                      <p className="mt-1 text-sm text-[color:var(--text-soft)]">Captura las tres mediciones que alimentan las graficas.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <input className="rounded-xl border border-mist/20 bg-white/5 px-3 py-2 text-white outline-none focus:border-glow" defaultValue={clinicalNotes.progress.date || "2022-03-15"} name="progressDate" type="date" />
                      <button className="rounded-xl bg-glow px-4 py-2 text-sm font-bold text-ink shadow-glow disabled:opacity-50" disabled={!selectedPatient} type="submit">Guardar pagina 6</button>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {resolvedProgressMetrics.map((metric, metricIndex) => (
                      <div className="rounded-2xl border border-mist/10 bg-white/5 p-4" key={metric.label}>
                        <div className={`mb-3 text-sm font-bold uppercase ${metric.text}`}>{metric.label}</div>
                        <div className="grid grid-cols-3 gap-2">
                          {metric.values.map((value, valueIndex) => (
                            <input className="min-w-0 rounded-lg border border-mist/10 bg-ink/40 px-2 py-2 text-center text-white outline-none focus:border-glow" defaultValue={value} key={valueIndex} name={`progress_${progressMetricKeys[metricIndex]}_${valueIndex}`} type="number" step="0.1" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="border-b border-mist/15 lg:border-b-0 lg:border-r">
                  <div className="grid grid-cols-[3rem_1fr] border-b border-mist/15">
                    <div className="grid place-items-center border-r border-mist/10 bg-glow/10 px-2 py-6">
                      <span className="-rotate-90 text-sm font-bold uppercase tracking-wide text-glow">Peso</span>
                    </div>
                    <div className="px-6 py-5">
                      <ProgressChart metrics={[resolvedProgressMetrics[0]]} height="h-44" />
                    </div>
                  </div>

                  <div className="grid grid-cols-[3rem_1fr] border-b border-mist/15">
                    <div className="grid place-items-center border-r border-mist/10 bg-amber-300/10 px-2 py-6">
                      <span className="-rotate-90 text-sm font-bold uppercase tracking-wide text-amber-200">Grasa</span>
                    </div>
                    <div className="px-6 py-5">
                      <ProgressChart metrics={[resolvedProgressMetrics[1]]} height="h-44" />
                    </div>
                  </div>

                  <div className="grid grid-cols-[3rem_1fr]">
                    <div className="grid place-items-center border-r border-mist/10 bg-emerald-300/10 px-2 py-8">
                      <span className="-rotate-90 whitespace-nowrap text-sm font-bold uppercase tracking-wide text-emerald-200">
                        Resumen general
                      </span>
                    </div>
                    <div className="px-6 py-8">
                      <ProgressChart metrics={resolvedProgressMetrics} height="h-64" />
                      <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs uppercase text-[color:var(--text-soft)]">
                        {resolvedProgressMetrics.map((metric) => (
                          <span className="flex items-center gap-2" key={metric.label}>
                            <i className={`h-2.5 w-2.5 rounded-full ${metric.band}`} />
                            {metric.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="px-6 py-7 lg:px-12">
                  <div className="grid max-w-sm gap-3">
                    <span className="w-fit rounded-lg border border-mist/25 bg-white/5 px-3 py-2 text-xs text-[color:var(--text-soft)]">
                      {resolvedProgressMetrics[2].values.at(-1)} % Musculo
                    </span>
                    <span className="w-fit rounded-lg border border-amber-300/50 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
                      {resolvedProgressMetrics[1].values.at(-1)} % Grasa
                    </span>
                  </div>

                  <div className="mt-5 flex min-h-[34rem] items-center justify-center rounded-3xl border border-mist/10 bg-white/5 p-6">
                    <div className="relative h-[30rem] w-56">
                      <div className="absolute left-1/2 top-0 h-16 w-14 -translate-x-1/2 rounded-full bg-rose-200/85" />
                      <div className="absolute left-1/2 top-14 h-40 w-24 -translate-x-1/2 rounded-[45%] bg-rose-200/85" />
                      <div className="absolute left-[1.45rem] top-16 h-40 w-10 rotate-[13deg] rounded-full bg-rose-200/85" />
                      <div className="absolute right-[1.45rem] top-16 h-40 w-10 -rotate-[13deg] rounded-full bg-rose-200/85" />
                      <div className="absolute left-[4.8rem] top-48 h-44 w-10 rounded-full bg-amber-200/90" />
                      <div className="absolute right-[4.8rem] top-48 h-44 w-10 rounded-full bg-amber-200/90" />
                      <div className="absolute left-[4.6rem] bottom-0 h-9 w-11 rounded-full bg-amber-200/90" />
                      <div className="absolute right-[4.6rem] bottom-0 h-9 w-11 rounded-full bg-amber-200/90" />
                      <div className="absolute left-[1.35rem] top-[12.7rem] h-8 w-10 rounded-full bg-amber-200/90" />
                      <div className="absolute right-[1.35rem] top-[12.7rem] h-8 w-10 rounded-full bg-amber-200/90" />
                      <div className="absolute left-1/2 top-[11.5rem] h-16 w-px -translate-x-1/2 bg-ink/30" />
                      <div className="absolute bottom-[-4.5rem] left-1/2 h-20 w-40 -translate-x-1/2 rounded-[50%] bg-glow/10 blur-md" />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {[
                      ["Ultima cita", clinicalNotes.progress.date || "2022-03-15"],
                      ["Peso", `${resolvedProgressMetrics[0].values.at(-1)} kg`],
                      ["Grasa", `${resolvedProgressMetrics[1].values.at(-1)}%`],
                      ["Musculo", `${resolvedProgressMetrics[2].values.at(-1)}%`]
                    ].map(([label, value]) => (
                      <div className="rounded-2xl border border-mist/10 bg-white/5 p-4 text-center" key={label}>
                        <div className="text-xs font-bold uppercase text-glow">{label}</div>
                        <div className="mt-1 text-sm text-white">{value}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </form>
            ) : (
            <form action={saveClinicalHistoryAction} className="px-6 py-6 lg:px-16">
              <input name="userId" type="hidden" value={selectedPatient?.id ?? ""} />
              <input name="page" type="hidden" value={selectedPage} />
              <section>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-glow/60 pb-2">
                  <h2 className="text-2xl uppercase text-glow">
                    Antecedentes de salud
                  </h2>
                  <button
                    className="rounded-xl bg-glow px-5 py-2 text-sm font-bold text-ink shadow-glow transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!selectedPatient}
                    type="submit"
                  >
                    Guardar historia clinica
                  </button>
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_16rem]">
                  <dl className="grid gap-2 text-base">
                    <div className="grid grid-cols-[14rem_1fr] gap-4">
                      <dt>Motivo de consulta:</dt>
                      <dd><EditableCell defaultValue={profile?.goal} name="goal" placeholder="Ej. Disminuir peso" /></dd>
                    </div>
                    <div className="grid grid-cols-[14rem_1fr] gap-4">
                      <dt>Padece alguna enfermedad?</dt>
                      <dd><EditableCell defaultValue={clinicalNotes.disease} name="disease" placeholder="Ej. Sin diagnostico cronico" /></dd>
                    </div>
                    <div className="grid grid-cols-[14rem_1fr] gap-4">
                      <dt>Toma medicamentos?</dt>
                      <dd><EditableCell defaultValue={profile?.medications} name="medications" placeholder="Ej. No / Si" /></dd>
                    </div>
                    <div className="grid grid-cols-[14rem_1fr] gap-4">
                      <dt>Nombre / Dosis</dt>
                      <dd><EditableCell defaultValue={clinicalNotes.medicationNameDose} name="medicationNameDose" placeholder="Nombre y dosis" /></dd>
                    </div>
                    <div className="grid grid-cols-[14rem_1fr] gap-4">
                      <dt>Consumo de alcohol</dt>
                      <dd><EditableCell defaultValue={clinicalNotes.alcohol} name="alcohol" placeholder="Frecuencia" /></dd>
                    </div>
                    <div className="grid grid-cols-[14rem_1fr] gap-4">
                      <dt>Consumo de tabaco</dt>
                      <dd><EditableCell defaultValue={clinicalNotes.tobacco} name="tobacco" placeholder="Frecuencia" /></dd>
                    </div>
                    <div className="grid grid-cols-[14rem_1fr] gap-4">
                      <dt>Alergias alimentarias</dt>
                      <dd><EditableCell defaultValue={profile?.foodAllergies} name="foodAllergies" placeholder="Ej. Sin alergias reportadas" /></dd>
                    </div>
                    <div className="grid grid-cols-[14rem_1fr] gap-4">
                      <dt>Peso actual (kg)</dt>
                      <dd>
                        <input
                          className="min-h-7 w-full rounded-lg border border-mist/10 bg-white/5 px-3 py-1 text-center text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                          defaultValue={lastEntry?.weightKg ?? profile?.currentWeightKg ?? ""}
                          name="weightKg"
                          placeholder="Ej. 76"
                          type="number"
                          step="0.1"
                        />
                      </dd>
                    </div>
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
                      {(["mother", "father", "patient"] as const).map((relative) => (
                        <label
                          className="grid min-h-10 cursor-pointer place-items-center border-l border-mist/10 transition hover:bg-glow/10"
                          key={relative}
                        >
                          <input
                            aria-label={`${row} - ${relative}`}
                            className="h-5 w-5 cursor-pointer accent-cyan-400"
                            defaultChecked={clinicalNotes.familyHistory[String(index)]?.[relative] ?? false}
                            name={`familyHistory_${index}_${relative}`}
                            type="checkbox"
                          />
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-right text-sm font-semibold italic">Marcar (+) si lo padece.</p>
              </section>

              <section className="mt-12 grid min-w-0 gap-10 xl:grid-cols-2">
                <div className="min-w-0">
                  <h2 className="border-b-2 border-glow/60 pb-1 text-2xl uppercase text-glow">
                    Aspectos ginecologicos
                  </h2>
                  <div className="mt-6 grid gap-2">
                    {gynecologicalRows.map((row, index) => (
                      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:items-center" key={row}>
                        <label htmlFor={`gynecological_${index}`}>{row}</label>
                        <input
                          className="min-h-10 min-w-0 w-full rounded-lg border border-mist/10 bg-white/5 px-3 py-2 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                          defaultValue={clinicalNotes.gynecological[String(index)] ?? ""}
                          id={`gynecological_${index}`}
                          name={`gynecological_${index}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="min-w-0">
                  <h2 className="border-b-2 border-glow/60 pb-1 text-2xl uppercase text-glow">
                    Signos y sintomas
                  </h2>
                  <div className="mt-6 min-w-0">
                    <div className="text-center text-lg font-semibold">
                      Aspecto general
                    </div>
                    <textarea
                      className="mt-2 block min-h-36 w-full max-w-full resize-y rounded-2xl border border-mist/10 bg-white/5 p-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                      defaultValue={clinicalNotes.generalCondition}
                      name="generalCondition"
                    />
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
                  <textarea
                    className="min-h-32 w-full resize-y bg-transparent text-white outline-none placeholder:text-slate-500"
                    defaultValue={clinicalNotes.comments}
                    name="comments"
                    placeholder="Sin comentarios generales registrados."
                  />
                </div>
              </section>
            </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
