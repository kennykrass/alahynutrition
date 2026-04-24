import { UserRole } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSessionSecret } from "@/lib/env";

const SESSION_COOKIE = "alahy_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: string;
  role: UserRole;
  email: string;
  fullName: string;
  mustChangePassword: boolean;
};

export function getDefaultDashboardPath(role: UserRole) {
  return role === UserRole.ADMIN ? "/admin" : "/patient";
}

export function getPostLoginPath(session: {
  role: UserRole;
  mustChangePassword: boolean;
}) {
  return session.mustChangePassword ? "/change-password" : getDefaultDashboardPath(session.role);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({
    role: payload.role,
    email: payload.email,
    fullName: payload.fullName,
    mustChangePassword: payload.mustChangePassword
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(new TextEncoder().encode(getSessionSecret()));

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS
  });
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE);
}

export async function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(getSessionSecret()));

    if (
      !payload.sub ||
      typeof payload.email !== "string" ||
      typeof payload.fullName !== "string" ||
      typeof payload.mustChangePassword !== "boolean"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      role: payload.role as UserRole,
      email: payload.email,
      fullName: payload.fullName,
      mustChangePassword: payload.mustChangePassword
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(role: UserRole) {
  const session = await requireUser();

  if (session.role !== role) {
    redirect(getDefaultDashboardPath(session.role));
  }

  return session;
}

export async function requireCompletedPasswordSetup() {
  const session = await requireUser();

  if (session.mustChangePassword) {
    redirect("/change-password");
  }

  return session;
}
