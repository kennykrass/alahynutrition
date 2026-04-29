import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth-card";
import { patientProfileCatalogs } from "@/lib/patient-profile-catalogs";
import { getPostLoginPath, getSession } from "@/lib/session";
import { registerAction } from "@/app/auth-actions";

type RegisterPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const session = await getSession();

  if (session) {
    redirect(getPostLoginPath(session));
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
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-[color:var(--text-soft)] md:col-span-2">
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
            Fecha de nacimiento
            <input
              className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition focus:border-glow"
              max={new Date().toISOString().slice(0, 10)}
              name="birthDate"
              required
              type="date"
            />
          </label>

          <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
            Genero biologico
            <select
              className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition focus:border-glow"
              defaultValue=""
              name="biologicalSex"
              required
            >
              <option disabled value="">
                Selecciona una opcion
              </option>
              {patientProfileCatalogs.biologicalSex.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
            Numero telefonico
            <input
              className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
              name="phone"
              placeholder="Tu telefono"
              required
              type="tel"
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
            Altura (cm)
            <input
              className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
              min="1"
              name="heightCm"
              placeholder="Ej. 170"
              required
              step="0.1"
              type="number"
            />
          </label>

          <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
            Peso actual (kg)
            <input
              className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
              min="1"
              name="currentWeightKg"
              placeholder="Ej. 72.5"
              required
              step="0.1"
              type="number"
            />
          </label>

          <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
            Has llevado un plan antes?
            <select
              className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition focus:border-glow"
              defaultValue="no"
              name="previousDietExperience"
              required
            >
              <option value="no">No</option>
              <option value="yes">Si</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm text-[color:var(--text-soft)]">
            Cuanto tiempo?
            <input
              className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
              name="previousDietDuration"
              placeholder="Ej. 3 meses"
              type="text"
            />
          </label>

          <label className="grid gap-2 text-sm text-[color:var(--text-soft)] md:col-span-2">
            Actividad fisica
            <select
              className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition focus:border-glow"
              defaultValue=""
              name="physicalActivityLevel"
              required
            >
              <option disabled value="">
                Selecciona una opcion
              </option>
              {patientProfileCatalogs.physicalActivityLevel.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-[color:var(--text-soft)] md:col-span-2">
            Contrasena
            <input
              className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
              name="password"
              placeholder="Minimo 8 caracteres"
              required
              type="password"
            />
          </label>
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-mist/20 bg-white/5 px-4 py-4 text-sm text-[color:var(--text-soft)]">
          <input
            className="mt-1 h-4 w-4 rounded border-mist/30 bg-ink/60 text-glow focus:ring-glow"
            name="acceptedPrivacy"
            required
            type="checkbox"
          />
          <span>
            Acepto el aviso de privacidad y autorizo el uso de mis datos para el seguimiento
            nutricional y la gestion de mi cuenta dentro de la plataforma.
          </span>
        </label>

        <button
          className="mt-2 rounded-2xl bg-glow px-4 py-3 text-sm font-semibold text-ink shadow-glow transition hover:translate-y-[-1px]"
          type="submit"
        >
          Crear cuenta
        </button>
      </form>

      <p className="mt-6 text-sm text-[color:var(--text-soft)]">
        Este formulario inicial crea tu cuenta y tu perfil base. La historia clinica completa se
        complementara antes de tu consulta.
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
