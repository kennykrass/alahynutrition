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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
