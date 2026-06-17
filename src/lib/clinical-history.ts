export const clinicalSections = [
  { label: "Historia clinica", value: "history" },
  { label: "Nutricion", value: "nutrition" },
  { label: "Progreso", value: "progress" },
  { label: "Analisis", value: "labs" }
];

export const familyHistoryRows = [
  "Obesidad",
  "Diabetes",
  "HTA",
  "Cancer",
  "Hipercolesterolemia",
  "Otro"
];

export const gynecologicalRows = [
  "Embarazo actual",
  "No. meses",
  "Anticonceptivos orales",
  "Climaterio",
  "Menopausia"
];

export const biochemicalIndicators = [
  {
    label: "Glucosa",
    unit: "mg/dl",
    reference: "70-110 mg/dl",
    value: 92,
    max: 200,
    goodUntil: 110
  },
  {
    label: "Colesterol",
    unit: "mg/dl",
    reference: "< 200 mg/dl",
    value: 178,
    max: 400,
    goodUntil: 200
  },
  {
    label: "Trigliceridos",
    unit: "mg/dl",
    reference: "< 150 mg/dl",
    value: 136,
    max: 200,
    goodUntil: 150
  },
  {
    label: "P. arterial sistolica",
    unit: "",
    reference: "< 120",
    value: 118,
    max: 200,
    goodUntil: 120
  },
  {
    label: "P. arterial diastolica",
    unit: "",
    reference: "< 80",
    value: 76,
    max: 200,
    goodUntil: 80
  }
];

export function formatClinicalDate(value?: Date | null) {
  if (!value) {
    return "Pendiente";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(value);
}

export function calculateAge(value?: Date | null) {
  if (!value) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - value.getFullYear();
  const hasNotHadBirthday =
    today.getMonth() < value.getMonth() ||
    (today.getMonth() === value.getMonth() && today.getDate() < value.getDate());

  if (hasNotHadBirthday) {
    age -= 1;
  }

  return age;
}

export function getIndicatorPercent(value: number, max: number) {
  return Math.min(100, Math.max(0, (value / max) * 100));
}
