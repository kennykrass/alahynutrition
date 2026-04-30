import Link from "next/link";
import { patientProfileCatalogs } from "@/lib/patient-profile-catalogs";

import { logoutAction, requestAppointmentAction, requestAppointmentRescheduleAction } from "@/app/auth-actions";
import { prisma } from "@/lib/prisma";
import { requireCompletedPasswordSetup, requireRole } from "@/lib/session";
import { UserRole } from "@prisma/client";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

type PatientDashboardPageProps = {
  searchParams?: {
    error?: string;
    success?: string;
  };
};

export default async function PatientDashboardPage({ searchParams }: PatientDashboardPageProps) {
  await requireCompletedPasswordSetup();
  const session = await requireRole(UserRole.PATIENT);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      profile: true,
      appointments: {
        orderBy: {
          scheduledAt: "asc"
        },
        take: 6
      },
      documents: {
        orderBy: {
          createdAt: "desc"
        }
      },
      entries: {
        orderBy: {
          loggedAt: "desc"
        },
        take: 3
      }
    }
  });

  if (!user) {
    return null;
  }

  return (
    <main className="px-6 py-8 md:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="glass stripe flex flex-col gap-6 rounded-[2rem] px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--text-soft)]">
              Panel del paciente
            </div>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl md:text-5xl">
              Hola, {user.fullName}
            </h1>
            <p className="mt-3 max-w-2xl text-[color:var(--text-soft)]">
              Aqui podras consultar tus datos clinicos, avances, historial y ajustes personalizados.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-mist/30 px-5 py-3 text-sm text-white transition hover:border-white"
              href="/"
            >
              Ver sitio publico
            </Link>
            <form action={logoutAction}>
              <button
                className="rounded-full bg-glow px-5 py-3 text-sm font-semibold text-ink shadow-glow"
                type="submit"
              >
                Cerrar sesion
              </button>
            </form>
          </div>
        </header>

        {searchParams?.success ? (
          <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
            {searchParams.success}
          </div>
        ) : null}

        {searchParams?.error ? (
          <div className="mt-8 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
            {searchParams.error}
          </div>
        ) : null}

        <section className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Cuenta
            </div>
            <div className="mt-4 text-xl font-semibold text-white">{user.email}</div>
            <div className="mt-2 text-sm text-[color:var(--text-soft)]">Rol actual: Paciente</div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Perfil
            </div>
            <div className="mt-4 text-xl font-semibold text-white">
              {user.profile?.goal || "Meta pendiente por registrar"}
            </div>
            <div className="mt-2 text-sm text-[color:var(--text-soft)]">
              Altura: {user.profile?.heightCm ? `${user.profile.heightCm} cm` : "Sin capturar"}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Progreso
            </div>
            <div className="mt-4 text-xl font-semibold text-white">
              {user.entries.length} registros disponibles
            </div>
            <div className="mt-2 text-sm text-[color:var(--text-soft)]">
              Proximamente aqui viviran graficas y comparativas.
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Solicitar cita
            </div>
            <p className="mt-3 text-sm text-[color:var(--text-soft)]">
              Solicita tu cita inicial, seguimiento, recomienzo o llamada. Si necesitas salirte del
              horario habitual, marca la solicitud como flexible.
            </p>

            <form action={requestAppointmentAction} className="mt-6 grid gap-4">
              <select
                className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                defaultValue=""
                name="type"
                required
              >
                <option disabled value="">
                  Tipo de cita
                </option>
                {patientProfileCatalogs.appointmentType.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <input
                className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                name="scheduledAt"
                required
                type="datetime-local"
              />

              <label className="flex items-center gap-3 text-sm text-[color:var(--text-soft)]">
                <input
                  className="h-4 w-4 rounded border-mist/30 bg-ink/60 text-glow focus:ring-glow"
                  name="isFlexibleRequest"
                  type="checkbox"
                />
                Solicitar fuera del horario habitual
              </label>

              <textarea
                className="min-h-28 rounded-3xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                name="notes"
                placeholder="Notas para la cita o contexto importante"
              />

              <button
                className="rounded-full bg-glow px-4 py-3 text-sm font-semibold text-ink shadow-glow transition hover:translate-y-[-1px]"
                type="submit"
              >
                Solicitar cita
              </button>
            </form>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
                Mis citas
              </div>
              <span className="rounded-full border border-mist/20 px-3 py-1 text-xs text-[color:var(--text-soft)]">
                {user.appointments.length} registradas
              </span>
            </div>

            <div className="mt-6 grid gap-4">
              {user.appointments.length ? (
                user.appointments.map((appointment) => (
                  <article key={appointment.id} className="rounded-2xl border border-mist/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-white">
                          {patientProfileCatalogs.appointmentType.find(
                            (option) => option.value === appointment.type
                          )?.label || appointment.type}
                        </div>
                        <div className="mt-1 text-sm text-[color:var(--text-soft)]">
                          {formatDateTime(appointment.scheduledAt)} · {appointment.durationMinutes} min
                        </div>
                      </div>

                      <div className="rounded-full border border-mist/20 px-3 py-1 text-xs text-[color:var(--text-soft)]">
                        {patientProfileCatalogs.appointmentStatus.find(
                          (option) => option.value === appointment.status
                        )?.label || appointment.status}
                      </div>
                    </div>

                    {appointment.notes ? (
                      <p className="mt-3 text-sm text-[color:var(--text-soft)]">{appointment.notes}</p>
                    ) : null}

                    {appointment.requestedScheduledAt ? (
                      <div className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        Reprogramacion solicitada para {formatDateTime(appointment.requestedScheduledAt)}
                        {appointment.requestedChangeNote ? ` · ${appointment.requestedChangeNote}` : ""}
                      </div>
                    ) : null}

                    {appointment.status !== "COMPLETED" && appointment.status !== "MISSED" ? (
                      <form
                        action={requestAppointmentRescheduleAction}
                        className="mt-4 grid gap-3 rounded-2xl border border-mist/15 bg-ink/30 p-4 md:grid-cols-[1fr_1fr]"
                      >
                        <input name="appointmentId" type="hidden" value={appointment.id} />
                        <input
                          className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                          name="requestedScheduledAt"
                          required
                          type="datetime-local"
                        />
                        <input
                          className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                          name="requestedChangeNote"
                          placeholder="Motivo o contexto de reprogramacion"
                          type="text"
                        />
                        <button
                          className="rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/10 md:col-span-2"
                          type="submit"
                        >
                          Solicitar reprogramacion
                        </button>
                      </form>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-mist/20 p-6 text-sm text-[color:var(--text-soft)]">
                  Aun no tienes citas registradas.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Datos iniciales
            </div>
            <dl className="mt-6 grid gap-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-mist/10 pb-4">
                <dt className="text-[color:var(--text-soft)]">Telefono</dt>
                <dd className="text-white">{user.profile?.phone || "Pendiente"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-mist/10 pb-4">
                <dt className="text-[color:var(--text-soft)]">Peso inicial</dt>
                <dd className="text-white">
                  {user.profile?.initialWeightKg ? `${user.profile.initialWeightKg} kg` : "Pendiente"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-mist/10 pb-4">
                <dt className="text-[color:var(--text-soft)]">Meta</dt>
                <dd className="text-white">{user.profile?.goal || "Pendiente"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[color:var(--text-soft)]">Notas</dt>
                <dd className="max-w-[16rem] text-right text-white">
                  {user.profile?.notes || "Sin notas registradas."}
                </dd>
              </div>
            </dl>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
                Historial reciente
              </div>
              <span className="rounded-full border border-mist/20 px-3 py-1 text-xs text-[color:var(--text-soft)]">
                Base lista para crecer
              </span>
            </div>

            <div className="mt-6 grid gap-4">
              {user.entries.length ? (
                user.entries.map((entry) => (
                  <article key={entry.id} className="rounded-2xl border border-mist/20 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
                      {formatDate(entry.loggedAt)}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-white">
                      <span>{entry.weightKg ? `${entry.weightKg} kg` : "Peso sin registrar"}</span>
                      <span>{entry.waistCm ? `${entry.waistCm} cm cintura` : "Cintura sin registrar"}</span>
                      <span>
                        {entry.bodyFatPct ? `${entry.bodyFatPct}% grasa corporal` : "Sin grasa corporal"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[color:var(--text-soft)]">
                      {entry.notes || "Sin notas para este registro."}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-mist/20 p-6 text-sm text-[color:var(--text-soft)]">
                  Aun no hay registros de progreso. La estructura ya esta lista para empezar a
                  capturarlos desde la siguiente iteracion.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 glass rounded-3xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Documentos disponibles
            </div>
            <span className="rounded-full border border-mist/20 px-3 py-1 text-xs text-[color:var(--text-soft)]">
              {user.documents.length} archivos
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            {user.documents.length ? (
              user.documents.map((document) => (
                <article key={document.id} className="rounded-2xl border border-mist/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold text-white">{document.title}</div>
                      <div className="mt-1 text-sm text-[color:var(--text-soft)]">
                        {patientProfileCatalogs.patientDocumentCategory.find(
                          (option) => option.value === document.category
                        )?.label || document.category}
                      </div>
                    </div>

                    <Link
                      className="rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/10"
                      href={`/documents/${document.id}`}
                      target="_blank"
                    >
                      Ver archivo
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-[color:var(--text-soft)] md:grid-cols-3">
                    <div>Archivo: {document.originalName}</div>
                    <div>Tamano: {formatFileSize(document.sizeBytes)}</div>
                    <div>Fecha: {formatDate(document.createdAt)}</div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-mist/20 p-6 text-sm text-[color:var(--text-soft)]">
                Aun no tienes documentos compartidos en tu expediente.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
