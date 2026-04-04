import Link from "next/link";

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  alternateHref: string;
  alternateLabel: string;
  alternateText: string;
  children: React.ReactNode;
  error?: string;
};

export function AuthCard({
  eyebrow,
  title,
  description,
  alternateHref,
  alternateLabel,
  alternateText,
  children,
  error
}: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12 md:px-12">
      <div className="grid w-full max-w-5xl gap-8 md:grid-cols-[0.95fr_1.05fr]">
        <section className="glass stripe rounded-[2rem] p-8 md:p-10">
          <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--text-soft)]">
            {eyebrow}
          </div>
          <h1 className="mt-6 font-[var(--font-display)] text-4xl leading-tight md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-[color:var(--text-soft)]">
            {description}
          </p>
          <div className="mt-10 grid gap-4 text-sm text-[color:var(--text-soft)]">
            <div className="glass rounded-2xl p-4">
              Acceso a tu seguimiento, historial y proximamente tus metricas de progreso.
            </div>
            <div className="glass rounded-2xl p-4">
              La plataforma nace como una base segura para pacientes y administracion.
            </div>
          </div>
        </section>

        <section className="glass rounded-[2rem] p-8 md:p-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm uppercase tracking-[0.3em] text-[color:var(--text-soft)]">
                Portal de pacientes
              </div>
              <p className="mt-3 text-sm text-[color:var(--text-soft)]">
                {alternateText}{" "}
                <Link className="text-glow transition hover:text-white" href={alternateHref}>
                  {alternateLabel}
                </Link>
              </p>
            </div>
            <Link
              className="rounded-full border border-mist/30 px-4 py-2 text-sm text-white transition hover:border-white"
              href="/"
            >
              Volver al sitio
            </Link>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
