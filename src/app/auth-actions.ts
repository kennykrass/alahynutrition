"use server";

import { Prisma, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminEmails } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  clearSession,
  createSession,
  getDefaultDashboardPath,
  getPostLoginPath,
  requireUser,
  requireRole
} from "@/lib/session";
import {
  adminPatientUpdateSchema,
  changePasswordSchema,
  loginSchema,
  registerSchema
} from "@/lib/validations";

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getOptionalField(formData: FormData, key: string) {
  const value = getField(formData, key).trim();
  return value ? value : undefined;
}

function redirectWithError(path: "/register" | "/login", message: string) {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function handleAuthActionError(path: "/register" | "/login", error: unknown): never {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    redirectWithError(path, "La conexion con la base de datos no esta configurada todavia.");
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    redirectWithError(path, "Ya existe una cuenta con ese correo.");
  }

  throw error;
}

function resolveUserRole(email: string) {
  return getAdminEmails().includes(email.toLowerCase()) ? UserRole.ADMIN : UserRole.PATIENT;
}

function parseOptionalFloat(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const values = crypto.getRandomValues(new Uint32Array(10));
  let raw = "";

  for (const value of values) {
    raw += alphabet[value % alphabet.length];
  }

  return `Alahy${raw}9`;
}

export async function registerAction(formData: FormData) {
  try {
    const result = registerSchema.safeParse({
      fullName: getField(formData, "fullName"),
      email: getField(formData, "email"),
      password: getField(formData, "password")
    });

    if (!result.success) {
      return redirectWithError(
        "/register",
        result.error.issues[0]?.message ?? "No pudimos crear la cuenta."
      );
    }

    const parsed = result.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.email }
    });

    if (existingUser) {
      redirectWithError("/register", "Ya existe una cuenta con ese correo.");
    }

    const passwordHash = await bcrypt.hash(parsed.password, 12);

    const user = await prisma.user.create({
      data: {
        fullName: parsed.fullName,
        email: parsed.email,
        passwordHash,
        role: resolveUserRole(parsed.email),
        profile: {
          create: {}
        }
      }
    });

    await createSession({
      sub: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      mustChangePassword: user.mustChangePassword
    });

    redirect(getPostLoginPath(user));
  } catch (error) {
    handleAuthActionError("/register", error);
  }
}

export async function loginAction(formData: FormData) {
  try {
    const result = loginSchema.safeParse({
      email: getField(formData, "email"),
      password: getField(formData, "password")
    });

    if (!result.success) {
      return redirectWithError(
        "/login",
        result.error.issues[0]?.message ?? "No pudimos iniciar sesion."
      );
    }

    const parsed = result.data;

    const user = await prisma.user.findUnique({
      where: { email: parsed.email }
    });

    if (!user) {
      return redirectWithError("/login", "Correo o contrasena incorrectos.");
    }

    const isValidPassword = await bcrypt.compare(parsed.password, user.passwordHash);

    if (!isValidPassword) {
      redirectWithError("/login", "Correo o contrasena incorrectos.");
    }

    const resolvedRole = resolveUserRole(user.email);
    const currentUser =
      user.role === resolvedRole
        ? user
        : await prisma.user.update({
            where: { id: user.id },
            data: { role: resolvedRole }
          });

    await createSession({
      sub: currentUser.id,
      role: currentUser.role,
      email: currentUser.email,
      fullName: currentUser.fullName,
      mustChangePassword: currentUser.mustChangePassword
    });

    redirect(getPostLoginPath(currentUser));
  } catch (error) {
    handleAuthActionError("/login", error);
  }
}

export async function logoutAction() {
  clearSession();
  redirect("/login");
}

export async function createPatientByAdminAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);

  const result = registerSchema.omit({ password: true }).extend({
    password: registerSchema.shape.password.optional()
  }).safeParse({
    fullName: getField(formData, "fullName"),
    email: getField(formData, "email"),
    password: undefined
  });

  if (!result.success) {
    redirect(
      `/admin?error=${encodeURIComponent(
        result.error.issues[0]?.message ?? "No pudimos dar de alta al paciente."
      )}`
    );
  }

  const parsed = result.data;
  const temporaryPassword = generateTemporaryPassword();

  if (resolveUserRole(parsed.email) === UserRole.ADMIN) {
    redirect("/admin?error=Ese%20correo%20esta%20reservado%20como%20administrador.");
  }

  try {
    await prisma.user.create({
      data: {
        fullName: parsed.fullName,
        email: parsed.email,
        passwordHash: await bcrypt.hash(temporaryPassword, 12),
        mustChangePassword: true,
        role: UserRole.PATIENT,
        profile: {
          create: {}
        }
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect("/admin?error=Ya%20existe%20una%20cuenta%20con%20ese%20correo.");
    }

    throw error;
  }

  revalidatePath("/admin");
  redirect(
    `/admin?success=${encodeURIComponent(
      "Paciente creado correctamente."
    )}&tempPassword=${encodeURIComponent(temporaryPassword)}`
  );
}

export async function deletePatientAction(formData: FormData) {
  const session = await requireRole(UserRole.ADMIN);
  const userId = getField(formData, "userId");

  if (!userId) {
    redirect("/admin?error=No%20pudimos%20identificar%20al%20paciente.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true
    }
  });

  if (!user) {
    redirect("/admin?error=El%20paciente%20ya%20no%20existe.");
  }

  if (user.id === session.userId) {
    redirect("/admin?error=No%20puedes%20eliminar%20tu%20propia%20cuenta.");
  }

  if (user.role !== UserRole.PATIENT) {
    redirect("/admin?error=Solo%20puedes%20eliminar%20cuentas%20de%20paciente.");
  }

  await prisma.user.delete({
    where: { id: user.id }
  });

  revalidatePath("/admin");
  redirect("/admin?success=Paciente%20eliminado%20correctamente.");
}

export async function updatePatientAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);

  const result = adminPatientUpdateSchema.safeParse({
    userId: getField(formData, "userId"),
    fullName: getField(formData, "fullName"),
    email: getField(formData, "email"),
    phone: getOptionalField(formData, "phone"),
    birthDate: getOptionalField(formData, "birthDate"),
    heightCm: getOptionalField(formData, "heightCm"),
    initialWeightKg: getOptionalField(formData, "initialWeightKg"),
    goal: getOptionalField(formData, "goal"),
    notes: getOptionalField(formData, "notes")
  });

  if (!result.success) {
    redirect(
      `/admin/patients/${encodeURIComponent(getField(formData, "userId"))}?error=${encodeURIComponent(
        result.error.issues[0]?.message ?? "No pudimos actualizar al paciente."
      )}`
    );
  }

  const parsed = result.data;

  if (resolveUserRole(parsed.email) === UserRole.ADMIN) {
    redirect(
      `/admin/patients/${encodeURIComponent(parsed.userId)}?error=${encodeURIComponent(
        "Ese correo pertenece a un administrador configurado en ADMIN_EMAILS."
      )}`
    );
  }

  const heightCm = parseOptionalFloat(parsed.heightCm);
  const initialWeightKg = parseOptionalFloat(parsed.initialWeightKg);

  if (Number.isNaN(heightCm) || Number.isNaN(initialWeightKg)) {
    redirect(
      `/admin/patients/${encodeURIComponent(parsed.userId)}?error=${encodeURIComponent(
        "Altura y peso inicial deben ser numeros validos."
      )}`
    );
  }

  const birthDate = parsed.birthDate ? new Date(`${parsed.birthDate}T00:00:00`) : undefined;

  if (birthDate && Number.isNaN(birthDate.getTime())) {
    redirect(
      `/admin/patients/${encodeURIComponent(parsed.userId)}?error=${encodeURIComponent(
        "La fecha de nacimiento no es valida."
      )}`
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: {
      id: true,
      role: true
    }
  });

  if (!existingUser) {
    redirect("/admin?error=El%20paciente%20que%20quieres%20editar%20ya%20no%20existe.");
  }

  if (existingUser.role !== UserRole.PATIENT) {
    redirect("/admin?error=Solo%20puedes%20editar%20cuentas%20de%20paciente.");
  }

  try {
    await prisma.user.update({
      where: { id: parsed.userId },
      data: {
        fullName: parsed.fullName,
        email: parsed.email,
        profile: {
          upsert: {
            create: {
              phone: parsed.phone,
              birthDate,
              heightCm,
              initialWeightKg,
              goal: parsed.goal,
              notes: parsed.notes
            },
            update: {
              phone: parsed.phone,
              birthDate,
              heightCm,
              initialWeightKg,
              goal: parsed.goal,
              notes: parsed.notes
            }
          }
        }
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(
        `/admin/patients/${encodeURIComponent(parsed.userId)}?error=${encodeURIComponent(
          "Ya existe otro usuario con ese correo."
        )}`
      );
    }

    throw error;
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/patients/${parsed.userId}`);
  revalidatePath("/patient");
  redirect(`/admin/patients/${encodeURIComponent(parsed.userId)}?success=Paciente%20actualizado%20correctamente.`);
}

export async function changePasswordAction(formData: FormData) {
  const session = await requireUser();

  const result = changePasswordSchema.safeParse({
    password: getField(formData, "password"),
    confirmPassword: getField(formData, "confirmPassword")
  });

  if (!result.success) {
    redirect(
      `/change-password?error=${encodeURIComponent(
        result.error.issues[0]?.message ?? "No pudimos actualizar tu contrasena."
      )}`
    );
  }

  const parsed = result.data;

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      passwordHash: await bcrypt.hash(parsed.password, 12),
      mustChangePassword: false
    }
  });

  await createSession({
    sub: session.userId,
    role: session.role,
    email: session.email,
    fullName: session.fullName,
    mustChangePassword: false
  });

  redirect(getDefaultDashboardPath(session.role));
}
