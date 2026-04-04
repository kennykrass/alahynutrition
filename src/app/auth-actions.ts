"use server";

import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { clearSession, createSession } from "@/lib/session";
import { loginSchema, registerSchema } from "@/lib/validations";

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    fullName: getField(formData, "fullName"),
    email: getField(formData, "email"),
    password: getField(formData, "password")
  });

  if (!parsed.success) {
    redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "No pudimos crear la cuenta.")}`);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });

  if (existingUser) {
    redirect("/register?error=Ya%20existe%20una%20cuenta%20con%20ese%20correo.");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
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
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: getField(formData, "email"),
    password: getField(formData, "password")
  });

  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "No pudimos iniciar sesion.")}`);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });

  if (!user) {
    redirect("/login?error=Correo%20o%20contrasena%20incorrectos.");
  }

  const isValidPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!isValidPassword) {
    redirect("/login?error=Correo%20o%20contrasena%20incorrectos.");
  }

  await createSession({
    sub: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  clearSession();
  redirect("/login");
}
