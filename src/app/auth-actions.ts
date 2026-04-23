"use server";

import { Prisma, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { getAdminEmails } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { clearSession, createSession, getDefaultDashboardPath } from "@/lib/session";
import { loginSchema, registerSchema } from "@/lib/validations";

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
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
      fullName: user.fullName
    });

    redirect(getDefaultDashboardPath(user.role));
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
      fullName: currentUser.fullName
    });

    redirect(getDefaultDashboardPath(currentUser.role));
  } catch (error) {
    handleAuthActionError("/login", error);
  }
}

export async function logoutAction() {
  clearSession();
  redirect("/login");
}
