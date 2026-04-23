"use server";

import { Prisma, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { clearSession, createSession } from "@/lib/session";
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

export async function registerAction(formData: FormData) {
  try {
    const result = registerSchema.safeParse({
      fullName: getField(formData, "fullName"),
      email: getField(formData, "email"),
      password: getField(formData, "password")
    });

    if (!result.success) {
      redirectWithError(
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
        role: UserRole.PATIENT,
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

    redirect("/dashboard");
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
      redirectWithError(
        "/login",
        result.error.issues[0]?.message ?? "No pudimos iniciar sesion."
      );
    }

    const parsed = result.data;

    const user = await prisma.user.findUnique({
      where: { email: parsed.email }
    });

    if (!user) {
      redirectWithError("/login", "Correo o contrasena incorrectos.");
    }

    const isValidPassword = await bcrypt.compare(parsed.password, user.passwordHash);

    if (!isValidPassword) {
      redirectWithError("/login", "Correo o contrasena incorrectos.");
    }

    await createSession({
      sub: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName
    });

    redirect("/dashboard");
  } catch (error) {
    handleAuthActionError("/login", error);
  }
}

export async function logoutAction() {
  clearSession();
  redirect("/login");
}
