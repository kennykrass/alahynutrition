import { redirect } from "next/navigation";

import { changePasswordAction } from "@/app/auth-actions";
import { getPostLoginPath, getSession } from "@/lib/session";

type ChangePasswordPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function ChangePasswordPage({ searchParams }: ChangePasswordPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.mustChangePassword) {
    redirect(getPostLoginPath(session));
  }

  return (
    <main className="px-6 py-10 md:px-12">
      <div className="mx-auto max-w-2xl">
        <section className="glass stripe rounded-[2rem] px-6 py-8 md:px-8">
          <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--text-soft)]">
            Primer acceso
          </div>
          <h1 className="mt-4 font-[var(--font-display)] text-4xl text-white">
            Actualiza tu contrasena
          </h1>
          <p className="mt-3 max-w-xl text-[color:var(--text-soft)]">
            Iniciaste sesion con una contrasena temporal. Antes de continuar, crea una nueva
            contrasena personal para proteger tu cuenta.
          </p>

          {searchParams?.error ? (
            <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
              {searchParams.error}
            </div>
          ) : null}

          <form action={changePasswordAction} className="mt-8 grid gap-5">
            <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
              Nueva contrasena
              <input
                className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                name="password"
                placeholder="Minimo 8 caracteres"
                required
                type="password"
              />
            </label>

            <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
              Confirmar contrasena
              <input
                className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                name="confirmPassword"
                placeholder="Repite la nueva contrasena"
                required
                type="password"
              />
            </label>

            <button
              className="mt-2 rounded-full bg-glow px-5 py-3 text-sm font-semibold text-ink shadow-glow transition hover:translate-y-[-1px]"
              type="submit"
            >
              Guardar nueva contrasena
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
