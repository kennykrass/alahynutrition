import {
  AppointmentStatus,
  AppointmentType,
  BiologicalSex,
  CareType,
  PatientStatus,
  PhysicalActivityLevel,
  PlanDuration,
  WeekDay
} from "@prisma/client";
import { z } from "zod";

const registerBaseSchema = z.object({
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
});

export const registerSchema = registerBaseSchema.superRefine((data, ctx) => {
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
  biologicalSex: z.nativeEnum(BiologicalSex).optional(),
  heightCm: z.string().trim().optional(),
  initialWeightKg: z.string().trim().optional(),
  currentWeightKg: z.string().trim().optional(),
  previousDietExperience: z.enum(["yes", "no"]).optional(),
  previousDietDuration: z.string().trim().optional(),
  physicalActivityLevel: z.nativeEnum(PhysicalActivityLevel).optional(),
  status: z.nativeEnum(PatientStatus).optional(),
  careType: z.nativeEnum(CareType).optional(),
  planDuration: z.nativeEnum(PlanDuration).optional(),
  contactSchedule: z.string().trim().max(200, "El horario de contacto es demasiado largo.").optional(),
  medications: z.string().trim().max(500, "La lista de medicamentos es demasiado larga.").optional(),
  foodAllergies: z.string().trim().max(500, "La lista de alergias es demasiado larga.").optional(),
  goal: z.string().trim().max(200, "La meta es demasiado larga.").optional(),
  notes: z.string().trim().max(1000, "Las notas son demasiado largas.").optional()
}).superRefine((data, ctx) => {
  if (data.previousDietExperience === "yes" && !data.previousDietDuration?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Indica cuanto tiempo llevo previamente un plan de alimentacion.",
      path: ["previousDietDuration"]
    });
  }
});

export const adminPatientCreateSchema = registerBaseSchema.omit({
  acceptedPrivacy: true,
  password: true
}).extend({
  careType: z.nativeEnum(CareType, {
    error: "Selecciona el tipo de atencion."
  }),
  planDuration: z.nativeEnum(PlanDuration, {
    error: "Selecciona la duracion del plan."
  }),
  status: z.nativeEnum(PatientStatus, {
    error: "Selecciona el estatus del paciente."
  })
});

export const availabilitySlotSchema = z.object({
  dayOfWeek: z.nativeEnum(WeekDay, {
    error: "Selecciona un dia valido."
  }),
  startTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "Escribe una hora inicial valida."),
  endTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "Escribe una hora final valida.")
}).refine((data) => data.endTime > data.startTime, {
  message: "La hora final debe ser posterior a la hora inicial.",
  path: ["endTime"]
});

export const appointmentBaseSchema = z.object({
  userId: z.string().trim().min(1, "No pudimos identificar al paciente."),
  type: z.nativeEnum(AppointmentType, {
    error: "Selecciona un tipo de cita valido."
  }),
  scheduledAt: z.string().trim().min(1, "Selecciona fecha y hora para la cita."),
  notes: z.string().trim().max(800, "Las notas son demasiado largas.").optional(),
  isFlexibleRequest: z.boolean().optional()
});

export const adminAppointmentCreateSchema = appointmentBaseSchema;

export const patientAppointmentRequestSchema = z.object({
  type: z.nativeEnum(AppointmentType, {
    error: "Selecciona un tipo de cita valido."
  }),
  scheduledAt: z.string().trim().min(1, "Selecciona una fecha y hora tentativa."),
  notes: z.string().trim().max(800, "Las notas son demasiado largas.").optional(),
  isFlexibleRequest: z.boolean().optional()
});

export const appointmentStatusUpdateSchema = z.object({
  appointmentId: z.string().trim().min(1, "No pudimos identificar la cita."),
  status: z.nativeEnum(AppointmentStatus, {
    error: "Selecciona un estatus valido."
  })
});

export const appointmentRescheduleRequestSchema = z.object({
  appointmentId: z.string().trim().min(1, "No pudimos identificar la cita."),
  requestedScheduledAt: z.string().trim().min(1, "Selecciona la nueva fecha tentativa."),
  requestedChangeNote: z.string().trim().max(800, "La nota de reprogramacion es demasiado larga.").optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AdminPatientUpdateInput = z.infer<typeof adminPatientUpdateSchema>;
export type AdminPatientCreateInput = z.infer<typeof adminPatientCreateSchema>;
export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;
export type AdminAppointmentCreateInput = z.infer<typeof adminAppointmentCreateSchema>;
export type PatientAppointmentRequestInput = z.infer<typeof patientAppointmentRequestSchema>;
export type AppointmentStatusUpdateInput = z.infer<typeof appointmentStatusUpdateSchema>;
export type AppointmentRescheduleRequestInput = z.infer<typeof appointmentRescheduleRequestSchema>;
