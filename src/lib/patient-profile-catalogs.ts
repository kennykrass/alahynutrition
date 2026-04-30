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
  ],
  patientDocumentCategory: [
    { value: "LAB_RESULT", label: "Estudio / laboratorio" },
    { value: "INDICATION", label: "Indicacion" },
    { value: "RECIPE", label: "Receta" },
    { value: "PREVIOUS_PLAN", label: "Plan anterior" }
  ],
  appointmentType: [
    { value: "INITIAL", label: "Inicial" },
    { value: "FOLLOW_UP", label: "Seguimiento" },
    { value: "RESTART", label: "Recomienzo" },
    { value: "VIDEO_CALL", label: "Videollamada" },
    { value: "PHONE_CALL", label: "Llamada normal" }
  ],
  appointmentStatus: [
    { value: "REQUESTED", label: "Solicitada" },
    { value: "CONFIRMED", label: "Confirmada" },
    { value: "RESCHEDULE_REQUESTED", label: "Reprogramacion solicitada" },
    { value: "COMPLETED", label: "Completada" },
    { value: "MISSED", label: "No asistio" }
  ],
  weekDay: [
    { value: "MONDAY", label: "Lunes" },
    { value: "TUESDAY", label: "Martes" },
    { value: "WEDNESDAY", label: "Miercoles" },
    { value: "THURSDAY", label: "Jueves" },
    { value: "FRIDAY", label: "Viernes" },
    { value: "SATURDAY", label: "Sabado" },
    { value: "SUNDAY", label: "Domingo" }
  ]
} as const;
