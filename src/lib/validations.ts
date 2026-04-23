import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(3, "Escribe tu nombre completo."),
  email: z.email("Escribe un correo valido.").transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres.")
    .regex(/[A-Z]/, "Incluye al menos una letra mayuscula.")
    .regex(/[a-z]/, "Incluye al menos una letra minuscula.")
    .regex(/[0-9]/, "Incluye al menos un numero.")
});

export const loginSchema = z.object({
  email: z.email("Escribe un correo valido.").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Escribe tu contrasena.")
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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AdminPatientUpdateInput = z.infer<typeof adminPatientUpdateSchema>;
