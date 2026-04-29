import Link from "next/link";

import { AuthCard } from "@/components/auth-card";
import { loginAction, logoutAction } from "@/app/auth-actions";
import { getPostLoginPath, getSession } from "@/lib/session";

type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session) {
    const dashboardPath = getPostLoginPath(session);

    return (
      <AuthCard
        alternateHref={dashboardPath}
        alternateLabel="Ir a mi panel"
        alternateText="Ya tienes una sesion activa."
        description="Tu cuenta ya esta autenticada. Puedes volver al panel correspondiente o cerrar sesion para entrar con otra cuenta."
        eyebrow="Sesion activa"
        title="Ya iniciaste sesion"
      >
        <div className="grid gap-4">
          <Link
            className="rounded-2xl bg-glow px-4 py-3 text-center text-sm font-semibold text-ink shadow-glow transition hover:translate-y-[-1px]"
            href={dashboardPath}
          >
            Ir a {session.role === "ADMIN" ? "admin" : "mi panel"}
          </Link>

          <form action={logoutAction}>
            <button
              className="w-full rounded-2xl border border-mist/25 bg-ink/40 px-4 py-3 text-sm font-medium text-white transition hover:border-white"
              type="submit"
            >
              Cerrar sesion
            </button>
          </form>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      alternateHref="/register"
      alternateLabel="Crear cuenta"
      alternateText="Todavia no tienes acceso?"
      description="Entra al portal del paciente para revisar tu informacion, registrar cambios y dar seguimiento a tus metas."
      eyebrow="Acceso"
      error={searchParams?.error}
      title="Inicia sesion en tu panel"
    >
      <form action={loginAction} className="grid gap-5">
        <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
          Correo electronico
          <input
            className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
            name="email"
            placeholder="tu@correo.com"
            required
            type="email"
          />
        </label>

        <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
          Contrasena
          <input
            className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
            name="password"
            placeholder="Tu contrasena"
            required
            type="password"
          />
        </label>

        <button
          className="mt-2 rounded-2xl bg-glow px-4 py-3 text-sm font-semibold text-ink shadow-glow transition hover:translate-y-[-1px]"
          type="submit"
        >
          Entrar al panel
        </button>
      </form>

      <div className="mt-8 text-sm text-[color:var(--text-soft)]">
        Aun no tienes cuenta?{" "}
        <Link className="text-glow transition hover:text-white" href="/register">
          Registrate aqui
        </Link>
      </div>
    </AuthCard>
  );
}
