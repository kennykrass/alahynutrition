import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth-card";
import { getDefaultDashboardPath, getSession } from "@/lib/session";
import { registerAction } from "@/app/auth-actions";

type RegisterPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const session = await getSession();

  if (session) {
    redirect(getDefaultDashboardPath(session.role));
  }

  return (
    <AuthCard
      alternateHref="/login"
      alternateLabel="Inicia sesion"
      alternateText="Ya tienes una cuenta?"
      description="Crea tu acceso para consultar tus avances, completar tus datos y mantener contacto con tu plan nutricional."
      eyebrow="Registro"
      error={searchParams?.error}
      title="Crea tu cuenta de paciente"
    >
      <form action={registerAction} className="grid gap-5">
        <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
          Nombre completo
          <input
            className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
            name="fullName"
            placeholder="Tu nombre completo"
            required
            type="text"
          />
        </label>

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
            placeholder="Minimo 8 caracteres"
            required
            type="password"
          />
        </label>

        <button
          className="mt-2 rounded-2xl bg-glow px-4 py-3 text-sm font-semibold text-ink shadow-glow transition hover:translate-y-[-1px]"
          type="submit"
        >
          Crear cuenta
        </button>
      </form>

      <p className="mt-6 text-sm text-[color:var(--text-soft)]">
        Al registrarte aceptas que este portal se encuentra en fase inicial y seguira creciendo con
        nuevas funciones para tu seguimiento.
      </p>

      <div className="mt-8 text-sm text-[color:var(--text-soft)]">
        Necesitas ayuda?{" "}
        <Link className="text-glow transition hover:text-white" href="https://wa.me/528113282818" target="_blank">
          Escribenos por WhatsApp
        </Link>
      </div>
    </AuthCard>
  );
}
