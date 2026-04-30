import Link from "next/link";
import { PatientStatus, Prisma, UserRole } from "@prisma/client";

import {
  archivePatientAction,
  createAppointmentByAdminAction,
  createAvailabilitySlotAction,
  createPatientByAdminAction,
  deleteAvailabilitySlotAction,
  deletePatientAction,
  logoutAction,
  updateAppointmentStatusAction
} from "@/app/auth-actions";
import { patientProfileCatalogs } from "@/lib/patient-profile-catalogs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

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

function calculateAgeFromBirthDate(value?: Date | null) {
  if (!value) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - value.getFullYear();
  const hasNotHadBirthdayYet =
    today.getMonth() < value.getMonth() ||
    (today.getMonth() === value.getMonth() && today.getDate() < value.getDate());

  if (hasNotHadBirthdayYet) {
    age -= 1;
  }

  return age;
}

type AdminDashboardPageProps = {
  searchParams?: {
    error?: string;
    success?: string;
    tempPassword?: string;
    query?: string;
    status?: string;
    careType?: string;
    planDuration?: string;
    includeArchived?: string;
  };
};

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const session = await requireRole(UserRole.ADMIN);
  const query = searchParams?.query?.trim() ?? "";
  const statusFilter = searchParams?.status?.trim() ?? "";
  const careTypeFilter = searchParams?.careType?.trim() ?? "";
  const planDurationFilter = searchParams?.planDuration?.trim() ?? "";
  const includeArchived = searchParams?.includeArchived === "true";

  const userWhere: Prisma.UserWhereInput = {
    ...(query
      ? {
          OR: [
            { fullName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { profile: { patientCode: { contains: query, mode: "insensitive" } } }
          ]
        }
      : {}),
    ...(statusFilter || careTypeFilter || planDurationFilter || !includeArchived
      ? {
          profile: {
            ...(statusFilter ? { status: statusFilter as PatientStatus } : {}),
            ...(careTypeFilter ? { careType: careTypeFilter as never } : {}),
            ...(planDurationFilter ? { planDuration: planDurationFilter as never } : {}),
            ...(!includeArchived && !statusFilter ? { status: { not: PatientStatus.ARCHIVED } } : {})
          }
        }
      : {})
  };

  const [
    adminUser,
    users,
    totalUsers,
    totalPatients,
    totalArchivedPatients,
    totalEntries,
    availabilitySlots,
    appointments
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId }
    }),
    prisma.user.findMany({
      where: userWhere,
      include: {
        profile: true,
        entries: {
          orderBy: {
            loggedAt: "desc"
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.user.count(),
    prisma.user.count({
      where: { role: UserRole.PATIENT }
    }),
    prisma.user.count({
      where: {
        role: UserRole.PATIENT,
        profile: {
          status: PatientStatus.ARCHIVED
        }
      }
    }),
    prisma.progressEntry.count(),
    prisma.availabilitySlot.findMany({
      where: { isActive: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
    }),
    prisma.appointment.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            profile: {
              select: {
                patientCode: true
              }
            }
          }
        }
      },
      orderBy: {
        scheduledAt: "asc"
      },
      take: 8
    })
  ]);

  if (!adminUser) {
    return null;
  }

  return (
    <main className="px-6 py-8 md:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="glass stripe flex flex-col gap-6 rounded-[2rem] px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--text-soft)]">
              Panel administrativo
            </div>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl md:text-5xl">
              Hola, {adminUser.fullName}
            </h1>
            <p className="mt-3 max-w-3xl text-[color:var(--text-soft)]">
              Desde aqui podras supervisar pacientes, revisar registros recientes y preparar las
              siguientes herramientas internas del consultorio.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-mist/30 px-5 py-3 text-sm text-white transition hover:border-white"
              href="/"
            >
              Ver sitio publico
            </Link>
            <Link
              className="rounded-full border border-mist/30 px-5 py-3 text-sm text-white transition hover:border-white"
              href="/patient"
            >
              Vista de paciente
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

        <section className="mt-8 grid gap-6 md:grid-cols-4">
          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Usuarios
            </div>
            <div className="mt-4 text-3xl font-semibold text-white">{totalUsers}</div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Pacientes
            </div>
            <div className="mt-4 text-3xl font-semibold text-white">{totalPatients}</div>
            <div className="mt-2 text-sm text-[color:var(--text-soft)]">
              {totalArchivedPatients} archivados
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Administradores
            </div>
            <div className="mt-4 text-3xl font-semibold text-white">{totalUsers - totalPatients}</div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Registros
            </div>
            <div className="mt-4 text-3xl font-semibold text-white">{totalEntries}</div>
          </div>
        </section>

        {searchParams?.success ? (
          <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
            {searchParams.success}
            {searchParams.tempPassword ? (
              <div className="mt-3 rounded-2xl border border-emerald-300/20 bg-black/10 px-4 py-3 font-mono text-emerald-50">
                Contrasena temporal: {searchParams.tempPassword}
              </div>
            ) : null}
          </div>
        ) : null}

        {searchParams?.error ? (
          <div className="mt-8 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
            {searchParams.error}
          </div>
        ) : null}

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Cuenta actual
            </div>
            <div className="mt-4 text-xl font-semibold text-white">{adminUser.email}</div>
            <div className="mt-2 text-sm text-[color:var(--text-soft)]">
              Acceso administrativo habilitado por rol.
            </div>

            <div className="mt-8 rounded-2xl border border-mist/20 p-4 text-sm text-[color:var(--text-soft)]">
              Para definir admins, agrega sus correos en `ADMIN_EMAILS` separados por coma en tu
              entorno local y en Vercel.
            </div>

            <div className="mt-8 rounded-2xl border border-mist/20 p-4">
              <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
                Alta manual de paciente
              </div>
              <form action={createPatientByAdminAction} className="mt-4 grid gap-3">
                <input
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                  name="fullName"
                  placeholder="Nombre completo"
                  required
                  type="text"
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                    max={new Date().toISOString().slice(0, 10)}
                    name="birthDate"
                    required
                    type="date"
                  />
                  <select
                    className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                    defaultValue=""
                    name="biologicalSex"
                    required
                  >
                    <option disabled value="">
                      Genero biologico
                    </option>
                    {patientProfileCatalogs.biologicalSex.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                    name="phone"
                    placeholder="Telefono"
                    required
                    type="tel"
                  />
                  <input
                    className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                    name="email"
                    placeholder="correo@ejemplo.com"
                    required
                    type="email"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                    min="1"
                    name="heightCm"
                    placeholder="Altura en cm"
                    required
                    step="0.1"
                    type="number"
                  />
                  <input
                    className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                    min="1"
                    name="currentWeightKg"
                    placeholder="Peso actual en kg"
                    required
                    step="0.1"
                    type="number"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                    defaultValue="no"
                    name="previousDietExperience"
                    required
                  >
                    <option value="no">No ha llevado plan antes</option>
                    <option value="yes">Si ha llevado plan antes</option>
                  </select>
                  <input
                    className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-glow"
                    name="previousDietDuration"
                    placeholder="Cuanto tiempo?"
                    type="text"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                    defaultValue=""
                    name="physicalActivityLevel"
                    required
                  >
                    <option disabled value="">
                      Actividad fisica
                    </option>
                    {patientProfileCatalogs.physicalActivityLevel.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                    defaultValue=""
                    name="careType"
                    required
                  >
                    <option disabled value="">
                      Tipo de atencion
                    </option>
                    {patientProfileCatalogs.careType.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                    defaultValue=""
                    name="planDuration"
                    required
                  >
                    <option disabled value="">
                      Duracion del plan
                    </option>
                    {patientProfileCatalogs.planDuration.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                    defaultValue="NEW"
                    name="status"
                    required
                  >
                    {patientProfileCatalogs.patientStatus.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-2xl border border-mist/20 bg-white/5 px-4 py-3 text-sm text-[color:var(--text-soft)]">
                  El sistema generara automaticamente una contrasena temporal y obligara al paciente
                  a cambiarla en su primer acceso.
                </div>
                <button
                  className="rounded-full bg-glow px-4 py-3 text-sm font-semibold text-ink shadow-glow transition hover:translate-y-[-1px]"
                  type="submit"
                >
                  Dar de alta paciente
                </button>
              </form>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
                Pacientes recientes
              </div>
              <span className="rounded-full border border-mist/20 px-3 py-1 text-xs text-[color:var(--text-soft)]">
                {users.length} resultados
              </span>
            </div>

            <form className="mt-6 grid gap-3 rounded-2xl border border-mist/15 bg-ink/30 p-4 md:grid-cols-2 xl:grid-cols-5">
              <input
                className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-glow xl:col-span-2"
                defaultValue={query}
                name="query"
                placeholder="Buscar por nombre, correo o ID"
                type="text"
              />
              <select
                className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                defaultValue={statusFilter}
                name="status"
              >
                <option value="">Todos los estatus</option>
                {patientProfileCatalogs.patientStatus.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                defaultValue={careTypeFilter}
                name="careType"
              >
                <option value="">Toda la atencion</option>
                {patientProfileCatalogs.careType.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                defaultValue={planDurationFilter}
                name="planDuration"
              >
                <option value="">Todos los planes</option>
                {patientProfileCatalogs.planDuration.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-3 text-sm text-[color:var(--text-soft)] xl:col-span-3">
                <input
                  className="h-4 w-4 rounded border-mist/30 bg-ink/60 text-glow focus:ring-glow"
                  defaultChecked={includeArchived}
                  name="includeArchived"
                  type="checkbox"
                  value="true"
                />
                Incluir pacientes archivados
              </label>

              <div className="flex flex-wrap gap-3 xl:col-span-2 xl:justify-end">
                <button
                  className="rounded-full bg-glow px-4 py-2 text-sm font-semibold text-ink shadow-glow transition hover:translate-y-[-1px]"
                  type="submit"
                >
                  Aplicar filtros
                </button>
                <Link
                  className="rounded-full border border-mist/25 px-4 py-2 text-sm text-white transition hover:border-white"
                  href="/admin"
                >
                  Limpiar
                </Link>
              </div>
            </form>

            <div className="mt-6 grid gap-4">
              {users.length ? (
                users.map((user) => (
                  <article key={user.id} className="rounded-2xl border border-mist/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-white">{user.fullName}</div>
                        <div className="text-sm text-[color:var(--text-soft)]">
                          {user.profile?.patientCode || "Sin ID"} · {user.email}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="rounded-full border border-mist/20 px-3 py-1 text-xs text-[color:var(--text-soft)]">
                          {user.role === UserRole.ADMIN ? "Administrador" : "Paciente"}
                        </div>
                        {user.profile?.status === PatientStatus.ARCHIVED ? (
                          <div className="rounded-full border border-amber-400/30 px-3 py-1 text-xs text-amber-100">
                            Archivado
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-[color:var(--text-soft)] md:grid-cols-3">
                      <div>Alta: {formatDate(user.createdAt)}</div>
                      <div>
                        Edad:{" "}
                        {calculateAgeFromBirthDate(user.profile?.birthDate) ?? "Sin fecha de nacimiento"}
                      </div>
                      <div>
                        Ultimo registro:{" "}
                        {user.entries[0] ? formatDate(user.entries[0].loggedAt) : "Sin registros"}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-[color:var(--text-soft)] md:grid-cols-3">
                      <div>
                        Estatus:{" "}
                        {patientProfileCatalogs.patientStatus.find(
                          (option) => option.value === user.profile?.status
                        )?.label || "Sin estatus"}
                      </div>
                      <div>
                        Atencion:{" "}
                        {patientProfileCatalogs.careType.find(
                          (option) => option.value === user.profile?.careType
                        )?.label || "Sin definir"}
                      </div>
                      <div>
                        Plan:{" "}
                        {patientProfileCatalogs.planDuration.find(
                          (option) => option.value === user.profile?.planDuration
                        )?.label || "Sin definir"}
                      </div>
                    </div>

                    {user.role === UserRole.PATIENT ? (
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                          className="rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/10"
                          href={`/admin/patients/${user.id}`}
                        >
                          Editar paciente
                        </Link>
                        <form action={archivePatientAction}>
                          <input name="userId" type="hidden" value={user.id} />
                          <input
                            name="nextStatus"
                            type="hidden"
                            value={
                              user.profile?.status === PatientStatus.ARCHIVED
                                ? PatientStatus.ACTIVE
                                : PatientStatus.ARCHIVED
                            }
                          />
                          <button
                            className="rounded-full border border-amber-400/30 px-4 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-300 hover:bg-amber-500/10"
                            type="submit"
                          >
                            {user.profile?.status === PatientStatus.ARCHIVED
                              ? "Restaurar paciente"
                              : "Archivar paciente"}
                          </button>
                        </form>
                        <form action={deletePatientAction}>
                          <input name="userId" type="hidden" value={user.id} />
                          <button
                            className="rounded-full border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-300 hover:bg-rose-500/10"
                            type="submit"
                          >
                            Eliminar paciente
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-mist/20 p-6 text-sm text-[color:var(--text-soft)]">
                  Aun no hay usuarios registrados.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="glass rounded-3xl p-6">
            <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
              Disponibilidad semanal
            </div>
            <p className="mt-3 text-sm text-[color:var(--text-soft)]">
              Define tus bloques base de atencion para citas virtuales o llamadas.
            </p>

            <form action={createAvailabilitySlotAction} className="mt-6 grid gap-3">
              <select
                className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                defaultValue=""
                name="dayOfWeek"
                required
              >
                <option disabled value="">
                  Dia de la semana
                </option>
                {patientProfileCatalogs.weekDay.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                  name="startTime"
                  required
                  type="time"
                />
                <input
                  className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow"
                  name="endTime"
                  required
                  type="time"
                />
              </div>

              <button
                className="rounded-full bg-glow px-4 py-3 text-sm font-semibold text-ink shadow-glow transition hover:translate-y-[-1px]"
                type="submit"
              >
                Agregar disponibilidad
              </button>
            </form>

            <div className="mt-6 grid gap-3">
              {availabilitySlots.length ? (
                availabilitySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-mist/20 p-4"
                  >
                    <div className="text-sm text-white">
                      {
                        patientProfileCatalogs.weekDay.find((option) => option.value === slot.dayOfWeek)
                          ?.label
                      }
                      : {slot.startTime} - {slot.endTime}
                    </div>
                    <form action={deleteAvailabilitySlotAction}>
                      <input name="slotId" type="hidden" value={slot.id} />
                      <button
                        className="rounded-full border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-100 transition hover:border-rose-300 hover:bg-rose-500/10"
                        type="submit"
                      >
                        Quitar
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-mist/20 p-4 text-sm text-[color:var(--text-soft)]">
                  Todavia no has definido disponibilidad base.
                </div>
              )}
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm uppercase tracking-[0.25em] text-[color:var(--text-soft)]">
                Agenda y citas
              </div>
              <span className="rounded-full border border-mist/20 px-3 py-1 text-xs text-[color:var(--text-soft)]">
                {appointments.length} proximas / recientes
              </span>
            </div>

            <form
              action={createAppointmentByAdminAction}
              className="mt-6 grid gap-3 rounded-2xl border border-mist/15 bg-ink/30 p-4 md:grid-cols-2"
            >
              <select
                className="rounded-2xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition focus:border-glow md:col-span-2"
                defaultValue=""
                name="userId"
                required
              >
                <option disabled value="">
                  Selecciona un paciente
                </option>
                {users
                  .filter((user) => user.role === UserRole.PATIENT)
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {(user.profile?.patientCode || "Sin ID") + " · " + user.fullName}
                    </option>
                  ))}
              </select>

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

              <label className="flex items-center gap-3 text-sm text-[color:var(--text-soft)] md:col-span-2">
                <input
                  className="h-4 w-4 rounded border-mist/30 bg-ink/60 text-glow focus:ring-glow"
                  name="isFlexibleRequest"
                  type="checkbox"
                />
                Cita flexible o fuera de horario
              </label>

              <textarea
                className="min-h-28 rounded-3xl border border-mist/25 bg-ink/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-glow md:col-span-2"
                name="notes"
                placeholder="Notas internas de la cita"
              />

              <button
                className="rounded-full bg-glow px-4 py-3 text-sm font-semibold text-ink shadow-glow transition hover:translate-y-[-1px] md:col-span-2"
                type="submit"
              >
                Crear cita
              </button>
            </form>

            <div className="mt-6 grid gap-4">
              {appointments.length ? (
                appointments.map((appointment) => (
                  <article key={appointment.id} className="rounded-2xl border border-mist/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-white">
                          {appointment.user.fullName}
                        </div>
                        <div className="mt-1 text-sm text-[color:var(--text-soft)]">
                          {appointment.user.profile?.patientCode || "Sin ID"} · {appointment.user.email}
                        </div>
                      </div>
                      <div className="rounded-full border border-mist/20 px-3 py-1 text-xs text-[color:var(--text-soft)]">
                        {patientProfileCatalogs.appointmentStatus.find(
                          (option) => option.value === appointment.status
                        )?.label || appointment.status}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-[color:var(--text-soft)] md:grid-cols-3">
                      <div>
                        Tipo:{" "}
                        {patientProfileCatalogs.appointmentType.find(
                          (option) => option.value === appointment.type
                        )?.label || appointment.type}
                      </div>
                      <div>Fecha: {formatDateTime(appointment.scheduledAt)}</div>
                      <div>Duracion: {appointment.durationMinutes} min</div>
                    </div>

                    {appointment.requestedScheduledAt ? (
                      <div className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        Reprogramacion solicitada para {formatDateTime(appointment.requestedScheduledAt)}
                        {appointment.requestedChangeNote ? ` · ${appointment.requestedChangeNote}` : ""}
                      </div>
                    ) : null}

                    {appointment.notes ? (
                      <p className="mt-3 text-sm text-[color:var(--text-soft)]">{appointment.notes}</p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-3">
                      {[
                        { value: "CONFIRMED", label: "Confirmar" },
                        { value: "COMPLETED", label: "Completar" },
                        { value: "MISSED", label: "No asistio" }
                      ].map((statusOption) => (
                        <form key={statusOption.value} action={updateAppointmentStatusAction}>
                          <input name="appointmentId" type="hidden" value={appointment.id} />
                          <input name="status" type="hidden" value={statusOption.value} />
                          <button
                            className="rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/10"
                            type="submit"
                          >
                            {statusOption.label}
                          </button>
                        </form>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-mist/20 p-6 text-sm text-[color:var(--text-soft)]">
                  Todavia no hay citas registradas.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
