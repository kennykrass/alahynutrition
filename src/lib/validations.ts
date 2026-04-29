import {
  BiologicalSex,
  CareType,
  PatientStatus,
  PhysicalActivityLevel,
  PlanDuration
} from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(3, "Escribe tu nombre completo."),
  birthDate: z.string().trim().min(1, "Selecciona tu fecha de nacimiento."),
  biologicalSex: z.nativeEnum(BiologicalSex, {
    error: "Selecciona tu genero biologico."
  }),
  phone: z.string().trim().min(8, "Escribe un numero telefonico valido.").max(30),
  email: z.email("Escribe un correo valido.").transform((value) => value.toLowerCase()),
  heightCm: z.coerce.number().positive("Escribe una altura valida."),
  currentWeightKg: z.coerce.number().positive("Escribe un peso valido."),
  previousDietExperience: z.enum(["yes", "no"]),
  previousDietDuration: z.string().trim().optional(),
  physicalActivityLevel: z.nativeEnum(PhysicalActivityLevel, {
    error: "Selecciona tu nivel de actividad fisica."
  }),
  acceptedPrivacy: z.literal(true, {
    error: "Debes aceptar el aviso de privacidad para registrarte."
  }),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres.")
    .regex(/[A-Z]/, "Incluye al menos una letra mayuscula.")
    .regex(/[a-z]/, "Incluye al menos una letra minuscula.")
    .regex(/[0-9]/, "Incluye al menos un numero.")
}).superRefine((data, ctx) => {
  if (data.previousDietExperience === "yes" && !data.previousDietDuration?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Indica cuanto tiempo llevaste ese plan de alimentacion.",
      path: ["previousDietDuration"]
    });
  }
});

export const loginSchema = z.object({
  email: z.email("Escribe un correo valido.").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Escribe tu contrasena.")
});

export const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contrasena debe tener al menos 8 caracteres.")
      .regex(/[A-Z]/, "Incluye al menos una letra mayuscula.")
      .regex(/[a-z]/, "Incluye al menos una letra minuscula.")
      .regex(/[0-9]/, "Incluye al menos un numero."),
    confirmPassword: z.string().min(1, "Confirma tu nueva contrasena.")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contrasenas no coinciden.",
    path: ["confirmPassword"]
  });

export const adminPatientUpdateSchema = z.object({
  userId: z.string().trim().min(1, "No pudimos identificar al paciente."),
  fullName: z.string().trim().min(3, "Escribe el nombre completo del paciente."),
  email: z.email("Escribe un correo valido.").transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(30, "El telefono es demasiado largo.").optional(),
  birthDate: z.string().trim().optional(),
  heightCm: z.string().trim().optional(),
  initialWeightKg: z.string().trim().optional(),
  goal: z.string().trim().max(200, "La meta es demasiado larga.").optional(),
  notes: z.string().trim().max(1000, "Las notas son demasiado largas.").optional()
});

export const patientProfileCatalogs = {
  biologicalSex: [
    { value: BiologicalSex.MALE, label: "Masculino" },
    { value: BiologicalSex.FEMALE, label: "Femenino" }
  ],
  physicalActivityLevel: [
    { value: PhysicalActivityLevel.NONE, label: "Sedentaria / Nula" },
    { value: PhysicalActivityLevel.LIGHT, label: "Ligera" },
    { value: PhysicalActivityLevel.MODERATE, label: "Moderada" },
    { value: PhysicalActivityLevel.INTENSE, label: "Intensa" }
  ],
  patientStatus: [
    { value: PatientStatus.NEW, label: "Alta nueva" },
    { value: PatientStatus.ACTIVE, label: "Activo" },
    { value: PatientStatus.PENDING, label: "Pendiente" },
    { value: PatientStatus.ARCHIVED, label: "Archivado" },
    { value: PatientStatus.EXPIRED, label: "Vencido" }
  ],
  careType: [
    { value: CareType.INITIAL, label: "Inicial" },
    { value: CareType.FOLLOW_UP, label: "Seguimiento" },
    { value: CareType.RESTART, label: "Recomienzo" }
  ],
  planDuration: [
    { value: PlanDuration.ONE_MONTH, label: "1 mes" },
    { value: PlanDuration.THREE_MONTHS, label: "3 meses" },
    { value: PlanDuration.SIX_MONTHS, label: "6 meses" },
    { value: PlanDuration.CUSTOM, label: "Personalizado" }
  ]
};

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AdminPatientUpdateInput = z.infer<typeof adminPatientUpdateSchema>;
