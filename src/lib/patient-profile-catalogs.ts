export const patientProfileCatalogs = {
  biologicalSex: [
    { value: "MALE", label: "Masculino" },
    { value: "FEMALE", label: "Femenino" }
  ],
  physicalActivityLevel: [
    { value: "NONE", label: "Sedentaria / Nula" },
    { value: "LIGHT", label: "Ligera" },
    { value: "MODERATE", label: "Moderada" },
    { value: "INTENSE", label: "Intensa" }
  ],
  patientStatus: [
    { value: "NEW", label: "Alta nueva" },
    { value: "ACTIVE", label: "Activo" },
    { value: "PENDING", label: "Pendiente" },
    { value: "ARCHIVED", label: "Archivado" },
    { value: "EXPIRED", label: "Vencido" }
  ],
  careType: [
    { value: "INITIAL", label: "Inicial" },
    { value: "FOLLOW_UP", label: "Seguimiento" },
    { value: "RESTART", label: "Recomienzo" }
  ],
  planDuration: [
    { value: "ONE_MONTH", label: "1 mes" },
    { value: "THREE_MONTHS", label: "3 meses" },
    { value: "SIX_MONTHS", label: "6 meses" },
    { value: "CUSTOM", label: "Personalizado" }
  ]
} as const;
