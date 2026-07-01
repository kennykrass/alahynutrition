"use server";

import {
  AppointmentStatus,
  AppointmentType,
  BiologicalSex,
  CareType,
  PatientDocumentCategory,
  PatientStatus,
  PhysicalActivityLevel,
  PlanDuration,
  Prisma,
  UserRole,
  WeekDay
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminEmails } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  clearSession,
  createSession,
  getDefaultDashboardPath,
  getPostLoginPath,
  requireUser,
  requireRole
} from "@/lib/session";
import { ensureClinicalDemoPatient } from "@/lib/clinical-demo-patient";
import {
  adminPatientCreateSchema,
  adminPatientUpdateSchema,
  adminAppointmentCreateSchema,
  appointmentRescheduleRequestSchema,
  appointmentStatusUpdateSchema,
  availabilitySlotSchema,
  changePasswordSchema,
  loginSchema,
  patientAppointmentRequestSchema,
  registerSchema
} from "@/lib/validations";

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getOptionalField(formData: FormData, key: string) {
  const value = getField(formData, key).trim();
  return value ? value : undefined;
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

function resolveUserRole(email: string) {
  return getAdminEmails().includes(email.toLowerCase()) ? UserRole.ADMIN : UserRole.PATIENT;
}

function parseOptionalFloat(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function calculateAgeFromBirthDate(birthDate: Date) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasNotHadBirthdayYet =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

  if (hasNotHadBirthdayYet) {
    age -= 1;
  }

  return age;
}

async function generatePatientCode(tx: Prisma.TransactionClient) {
  const totalProfiles = await tx.patientProfile.count();
  return `AL-${String(totalProfiles + 1).padStart(4, "0")}`;
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const values = crypto.getRandomValues(new Uint32Array(10));
  let raw = "";

  for (const value of values) {
    raw += alphabet[value % alphabet.length];
  }

  return `Alahy${raw}9`;
}

function parseDateTimeLocal(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getAppointmentDuration(type: AppointmentType) {
  switch (type) {
    case AppointmentType.INITIAL:
      return 75;
    case AppointmentType.FOLLOW_UP:
      return 40;
    case AppointmentType.RESTART:
      return 40;
    case AppointmentType.VIDEO_CALL:
      return 40;
    case AppointmentType.PHONE_CALL:
      return 30;
    default:
      return 40;
  }
}

function redirectToPatientEditorWithError(userId: string, message: string): never {
  redirect(`/admin/patients/${encodeURIComponent(userId)}?error=${encodeURIComponent(message)}`);
}

function redirectToPatientEditorWithSuccess(userId: string, message: string): never {
  redirect(`/admin/patients/${encodeURIComponent(userId)}?success=${encodeURIComponent(message)}`);
}

export async function registerAction(formData: FormData) {
  try {
    const result = registerSchema.safeParse({
      fullName: getField(formData, "fullName"),
      birthDate: getField(formData, "birthDate"),
      biologicalSex: getField(formData, "biologicalSex"),
      phone: getField(formData, "phone"),
      email: getField(formData, "email"),
      heightCm: getField(formData, "heightCm"),
      currentWeightKg: getField(formData, "currentWeightKg"),
      previousDietExperience: getField(formData, "previousDietExperience"),
      previousDietDuration: getOptionalField(formData, "previousDietDuration"),
      physicalActivityLevel: getField(formData, "physicalActivityLevel"),
      acceptedPrivacy: formData.get("acceptedPrivacy") === "on",
      password: getField(formData, "password")
    });

    if (!result.success) {
      return redirectWithError(
        "/register",
        result.error.issues[0]?.message ?? "No pudimos crear la cuenta."
      );
    }

    const parsed = result.data;
    const birthDate = new Date(`${parsed.birthDate}T00:00:00`);

    if (Number.isNaN(birthDate.getTime())) {
      return redirectWithError("/register", "La fecha de nacimiento no es valida.");
    }

    const age = calculateAgeFromBirthDate(birthDate);

    if (age < 10 || age > 120) {
      return redirectWithError("/register", "La fecha de nacimiento genera una edad no valida.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.email }
    });

    if (existingUser) {
      redirectWithError("/register", "Ya existe una cuenta con ese correo.");
    }

    const passwordHash = await bcrypt.hash(parsed.password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const patientCode = await generatePatientCode(tx);

      return tx.user.create({
        data: {
          fullName: parsed.fullName,
          email: parsed.email,
          passwordHash,
          role: resolveUserRole(parsed.email),
          profile: {
            create: {
              patientCode,
              phone: parsed.phone,
              birthDate,
              biologicalSex: parsed.biologicalSex,
              heightCm: parsed.heightCm,
              initialWeightKg: parsed.currentWeightKg,
              currentWeightKg: parsed.currentWeightKg,
              previousDietExperience: parsed.previousDietExperience === "yes",
              previousDietDuration:
                parsed.previousDietExperience === "yes" ? parsed.previousDietDuration : undefined,
              physicalActivityLevel: parsed.physicalActivityLevel,
              status: PatientStatus.NEW,
              careType: CareType.INITIAL,
              planDuration: PlanDuration.CUSTOM,
              acceptedPrivacyAt: new Date(),
              notes: `Edad calculada al registro: ${age} anos.`
            }
          }
        }
      });
    });

    await createSession({
      sub: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      mustChangePassword: user.mustChangePassword
    });

    redirect(getPostLoginPath(user));
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
      return redirectWithError(
        "/login",
        result.error.issues[0]?.message ?? "No pudimos iniciar sesion."
      );
    }

    const parsed = result.data;

    const user = await prisma.user.findUnique({
      where: { email: parsed.email }
    });

    if (!user) {
      return redirectWithError("/login", "Correo o contrasena incorrectos.");
    }

    const isValidPassword = await bcrypt.compare(parsed.password, user.passwordHash);

    if (!isValidPassword) {
      redirectWithError("/login", "Correo o contrasena incorrectos.");
    }

    const resolvedRole = resolveUserRole(user.email);
    const currentUser =
      user.role === resolvedRole
        ? user
        : await prisma.user.update({
            where: { id: user.id },
            data: { role: resolvedRole }
          });

    await createSession({
      sub: currentUser.id,
      role: currentUser.role,
      email: currentUser.email,
      fullName: currentUser.fullName,
      mustChangePassword: currentUser.mustChangePassword
    });

    redirect(getPostLoginPath(currentUser));
  } catch (error) {
    handleAuthActionError("/login", error);
  }
}

export async function logoutAction() {
  clearSession();
  redirect("/login");
}

function parseClinicalNotesJson(notes?: string | null): Record<string, unknown> {
  if (!notes) {
    return {};
  }

  try {
    const parsed = JSON.parse(notes);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return { comments: notes };
  }
}

export async function createClinicalDemoPatientAction() {
  await requireRole(UserRole.ADMIN);

  const user = await ensureClinicalDemoPatient();

  revalidatePath("/admin");
  revalidatePath("/admin/clinical-history");
  redirect(`/admin/clinical-history?patientId=${encodeURIComponent(user.id)}&success=Paciente%20demo%20listo%20para%20editar.`);
}

export async function saveClinicalHistoryAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);

  const userId = getField(formData, "userId");
  const page = getField(formData, "page") || "1";

  if (!userId) {
    redirect("/admin/clinical-history?error=Selecciona%20un%20paciente%20antes%20de%20guardar.");
  }

  const weightKg = parseOptionalFloat(getField(formData, "weightKg"));

  if (Number.isNaN(weightKg)) {
    redirect(`/admin/clinical-history?patientId=${encodeURIComponent(userId)}&page=${encodeURIComponent(page)}&error=El%20peso%20debe%20ser%20un%20numero%20valido.`);
  }

  const existingProfile = await prisma.patientProfile.findUnique({
    where: { userId },
    select: { notes: true }
  });

  const notesPayload = {
    ...parseClinicalNotesJson(existingProfile?.notes),
    disease: getField(formData, "disease").trim(),
    medicationNameDose: getField(formData, "medicationNameDose").trim(),
    alcohol: getField(formData, "alcohol").trim(),
    tobacco: getField(formData, "tobacco").trim(),
    generalCondition: getField(formData, "generalCondition").trim(),
    comments: getField(formData, "comments").trim(),
    familyHistory: Object.fromEntries(
      Array.from({ length: 6 }, (_, index) => [
        String(index),
        {
          mother: getField(formData, `familyHistory_${index}_mother`) === "on",
          father: getField(formData, `familyHistory_${index}_father`) === "on",
          patient: getField(formData, `familyHistory_${index}_patient`) === "on"
        }
      ])
    ),
    gynecological: Object.fromEntries(
      Array.from({ length: 5 }, (_, index) => [
        String(index),
        getField(formData, `gynecological_${index}`).trim()
      ])
    )
  };

  const existingEntry = await prisma.progressEntry.findFirst({
    where: { userId },
    orderBy: { loggedAt: "desc" },
    select: { id: true }
  });

  await prisma.$transaction(async (tx) => {
    await tx.patientProfile.upsert({
      where: { userId },
      update: {
        goal: getField(formData, "goal").trim() || null,
        medications: getField(formData, "medications").trim() || null,
        foodAllergies: getField(formData, "foodAllergies").trim() || null,
        currentWeightKg: weightKg,
        notes: JSON.stringify(notesPayload)
      },
      create: {
        userId,
        patientCode: await generatePatientCode(tx),
        goal: getField(formData, "goal").trim() || null,
        medications: getField(formData, "medications").trim() || null,
        foodAllergies: getField(formData, "foodAllergies").trim() || null,
        currentWeightKg: weightKg,
        notes: JSON.stringify(notesPayload)
      }
    });

    if (existingEntry) {
      await tx.progressEntry.update({
        where: { id: existingEntry.id },
        data: {
          weightKg,
          notes: notesPayload.comments || "Historia clinica actualizada"
        }
      });
    } else if (weightKg !== undefined) {
      await tx.progressEntry.create({
        data: {
          userId,
          weightKg,
          notes: notesPayload.comments || "Historia clinica actualizada"
        }
      });
    }
  });

  revalidatePath("/admin/clinical-history");
  revalidatePath(`/admin/patients/${userId}`);
  redirect(`/admin/clinical-history?patientId=${encodeURIComponent(userId)}&page=${encodeURIComponent(page)}&success=Historia%20clinica%20guardada.`);
}

export async function saveClinicalFoodRecallAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);

  const userId = getField(formData, "userId");

  if (!userId) {
    redirect("/admin/clinical-history?page=2&error=Selecciona%20un%20paciente%20antes%20de%20guardar.");
  }

  const existingProfile = await prisma.patientProfile.findUnique({
    where: { userId },
    select: { notes: true }
  });
  const mealKeys = ["breakfast", "lunch", "dinner"];
  const foodRecall = Object.fromEntries(
    mealKeys.map((mealKey) => [
      mealKey,
      Array.from({ length: 6 }, (_, index) => ({
        name: getField(formData, `foodRecall_${mealKey}_${index}_name`).trim(),
        quantity: getField(formData, `foodRecall_${mealKey}_${index}_quantity`).trim(),
        unit: getField(formData, `foodRecall_${mealKey}_${index}_unit`).trim()
      }))
    ])
  );

  await prisma.$transaction(async (tx) => {
    await tx.patientProfile.upsert({
      where: { userId },
      update: {
        notes: JSON.stringify({
          ...parseClinicalNotesJson(existingProfile?.notes),
          foodRecall
        })
      },
      create: {
        userId,
        patientCode: await generatePatientCode(tx),
        notes: JSON.stringify({ foodRecall })
      }
    });
  });

  revalidatePath("/admin/clinical-history");
  redirect(`/admin/clinical-history?patientId=${encodeURIComponent(userId)}&page=2&success=Recordatorio%20de%2024%20horas%20guardado.`);
}

export async function saveClinicalPatientSummaryAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);

  const userId = getField(formData, "userId");
  const page = getField(formData, "page") || "1";
  const fullName = getField(formData, "fullName").trim();
  const biologicalSex = getField(formData, "biologicalSex") as BiologicalSex;
  const physicalActivityLevel = getField(formData, "physicalActivityLevel") as PhysicalActivityLevel;
  const heightM = Number(getField(formData, "heightM"));
  const age = Number(getField(formData, "age"));
  const weightKg = Number(getField(formData, "weightKg"));
  const registrationDate = new Date(`${getField(formData, "registrationDate")}T12:00:00`);

  const redirectPath = `/admin/clinical-history?patientId=${encodeURIComponent(userId)}&page=${encodeURIComponent(page)}`;

  if (!userId || fullName.length < 3) {
    redirect(`${redirectPath}&error=Escribe%20un%20nombre%20valido.`);
  }

  if (!Object.values(BiologicalSex).includes(biologicalSex)) {
    redirect(`${redirectPath}&error=Selecciona%20un%20sexo%20valido.`);
  }

  if (!Object.values(PhysicalActivityLevel).includes(physicalActivityLevel)) {
    redirect(`${redirectPath}&error=Selecciona%20un%20nivel%20de%20actividad%20valido.`);
  }

  if (!Number.isFinite(heightM) || heightM < 1 || heightM > 2.5) {
    redirect(`${redirectPath}&error=La%20talla%20debe%20estar%20entre%201%20y%202.5%20metros.`);
  }

  if (!Number.isInteger(age) || age < 10 || age > 120) {
    redirect(`${redirectPath}&error=La%20edad%20debe%20estar%20entre%2010%20y%20120%20anos.`);
  }

  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) {
    redirect(`${redirectPath}&error=El%20peso%20debe%20estar%20entre%2020%20y%20400%20kg.`);
  }

  if (Number.isNaN(registrationDate.getTime())) {
    redirect(`${redirectPath}&error=Selecciona%20una%20fecha%20de%20registro%20valida.`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true }
  });

  if (!user || user.role !== UserRole.PATIENT) {
    redirect("/admin/clinical-history?error=El%20paciente%20ya%20no%20existe.");
  }

  const birthDate = new Date();
  birthDate.setHours(12, 0, 0, 0);
  birthDate.setFullYear(birthDate.getFullYear() - age);

  const existingEntry = await prisma.progressEntry.findFirst({
    where: { userId },
    orderBy: { loggedAt: "desc" },
    select: { id: true }
  });

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        fullName,
        createdAt: registrationDate
      }
    });

    await tx.patientProfile.upsert({
      where: { userId },
      update: {
        birthDate,
        biologicalSex,
        heightCm: heightM * 100,
        currentWeightKg: weightKg,
        physicalActivityLevel,
        goal: getField(formData, "goal").trim() || null
      },
      create: {
        userId,
        patientCode: await generatePatientCode(tx),
        birthDate,
        biologicalSex,
        heightCm: heightM * 100,
        initialWeightKg: weightKg,
        currentWeightKg: weightKg,
        physicalActivityLevel,
        goal: getField(formData, "goal").trim() || null
      }
    });

    if (existingEntry) {
      await tx.progressEntry.update({
        where: { id: existingEntry.id },
        data: { weightKg }
      });
    } else {
      await tx.progressEntry.create({
        data: { userId, weightKg }
      });
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/clinical-history");
  revalidatePath(`/admin/patients/${userId}`);
  redirect(`${redirectPath}&success=Ficha%20tecnica%20guardada.`);
}

export async function createPatientByAdminAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);

  const result = adminPatientCreateSchema.safeParse({
    fullName: getField(formData, "fullName"),
    birthDate: getField(formData, "birthDate"),
    biologicalSex: getField(formData, "biologicalSex"),
    phone: getField(formData, "phone"),
    email: getField(formData, "email"),
    heightCm: getField(formData, "heightCm"),
    currentWeightKg: getField(formData, "currentWeightKg"),
    previousDietExperience: getField(formData, "previousDietExperience"),
    previousDietDuration: getOptionalField(formData, "previousDietDuration"),
    physicalActivityLevel: getField(formData, "physicalActivityLevel"),
    careType: getField(formData, "careType"),
    planDuration: getField(formData, "planDuration"),
    status: getField(formData, "status")
  });

  if (!result.success) {
    redirect(
      `/admin?error=${encodeURIComponent(
        result.error.issues[0]?.message ?? "No pudimos dar de alta al paciente."
      )}`
    );
  }

  const parsed = result.data;
  const temporaryPassword = generateTemporaryPassword();
  const birthDate = new Date(`${parsed.birthDate}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    redirect("/admin?error=La%20fecha%20de%20nacimiento%20no%20es%20valida.");
  }

  const age = calculateAgeFromBirthDate(birthDate);

  if (age < 10 || age > 120) {
    redirect("/admin?error=La%20fecha%20de%20nacimiento%20genera%20una%20edad%20no%20valida.");
  }

  if (resolveUserRole(parsed.email) === UserRole.ADMIN) {
    redirect("/admin?error=Ese%20correo%20esta%20reservado%20como%20administrador.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const patientCode = await generatePatientCode(tx);

      await tx.user.create({
        data: {
          fullName: parsed.fullName,
          email: parsed.email,
          passwordHash: await bcrypt.hash(temporaryPassword, 12),
          mustChangePassword: true,
          role: UserRole.PATIENT,
          profile: {
            create: {
              patientCode,
              phone: parsed.phone,
              birthDate,
              biologicalSex: parsed.biologicalSex,
              heightCm: parsed.heightCm,
              initialWeightKg: parsed.currentWeightKg,
              currentWeightKg: parsed.currentWeightKg,
              previousDietExperience: parsed.previousDietExperience === "yes",
              previousDietDuration:
                parsed.previousDietExperience === "yes" ? parsed.previousDietDuration : undefined,
              physicalActivityLevel: parsed.physicalActivityLevel,
              status: parsed.status,
              careType: parsed.careType,
              planDuration: parsed.planDuration,
              notes: `Edad calculada al alta manual: ${age} anos.`
            }
          }
        }
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect("/admin?error=Ya%20existe%20una%20cuenta%20con%20ese%20correo.");
    }

    throw error;
  }

  revalidatePath("/admin");
  redirect(
    `/admin?success=${encodeURIComponent(
      "Paciente creado correctamente."
    )}&tempPassword=${encodeURIComponent(temporaryPassword)}`
  );
}

export async function deletePatientAction(formData: FormData) {
  const session = await requireRole(UserRole.ADMIN);
  const userId = getField(formData, "userId");

  if (!userId) {
    redirect("/admin?error=No%20pudimos%20identificar%20al%20paciente.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true
    }
  });

  if (!user) {
    redirect("/admin?error=El%20paciente%20ya%20no%20existe.");
  }

  if (user.id === session.userId) {
    redirect("/admin?error=No%20puedes%20eliminar%20tu%20propia%20cuenta.");
  }

  if (user.role !== UserRole.PATIENT) {
    redirect("/admin?error=Solo%20puedes%20eliminar%20cuentas%20de%20paciente.");
  }

  await prisma.user.delete({
    where: { id: user.id }
  });

  revalidatePath("/admin");
  redirect("/admin?success=Paciente%20eliminado%20correctamente.");
}

export async function archivePatientAction(formData: FormData) {
  const session = await requireRole(UserRole.ADMIN);
  const userId = getField(formData, "userId");
  const nextStatus = getField(formData, "nextStatus");

  if (!userId) {
    redirect("/admin?error=No%20pudimos%20identificar%20al%20paciente.");
  }

  if (nextStatus !== PatientStatus.ARCHIVED && nextStatus !== PatientStatus.ACTIVE) {
    redirect("/admin?error=No%20pudimos%20resolver%20el%20nuevo%20estatus.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true
    }
  });

  if (!user) {
    redirect("/admin?error=El%20paciente%20ya%20no%20existe.");
  }

  if (user.id === session.userId) {
    redirect("/admin?error=No%20puedes%20archivar%20tu%20propia%20cuenta.");
  }

  if (user.role !== UserRole.PATIENT) {
    redirect("/admin?error=Solo%20puedes%20actualizar%20cuentas%20de%20paciente.");
  }

  await prisma.patientProfile.upsert({
    where: { userId: user.id },
    update: {
      status: nextStatus
    },
    create: {
      userId: user.id,
      status: nextStatus
    }
  });

  revalidatePath("/admin");
  redirect(
    `/admin?success=${encodeURIComponent(
      nextStatus === PatientStatus.ARCHIVED
        ? "Paciente archivado correctamente."
        : "Paciente restaurado correctamente."
    )}`
  );
}

export async function uploadPatientDocumentAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);

  const userId = getField(formData, "userId");
  const title = getField(formData, "title").trim();
  const category = getField(formData, "category");
  const file = formData.get("documentFile");

  if (!userId) {
    redirect("/admin?error=No%20pudimos%20identificar%20al%20paciente.");
  }

  if (!title || title.length < 3) {
    redirectToPatientEditorWithError(userId, "Escribe un titulo claro para el documento.");
  }

  if (!Object.values(PatientDocumentCategory).includes(category as PatientDocumentCategory)) {
    redirectToPatientEditorWithError(userId, "Selecciona una categoria valida para el documento.");
  }

  if (!(file instanceof File) || file.size === 0) {
    redirectToPatientEditorWithError(userId, "Selecciona un archivo PDF o imagen.");
  }

  if (!(file.type === "application/pdf" || file.type.startsWith("image/"))) {
    redirectToPatientEditorWithError(userId, "Solo se permiten archivos PDF o imagen.");
  }

  const maxFileSizeBytes = 5 * 1024 * 1024;

  if (file.size > maxFileSizeBytes) {
    redirectToPatientEditorWithError(userId, "El archivo excede el limite de 5 MB.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true
    }
  });

  if (!user || user.role !== UserRole.PATIENT) {
    redirect("/admin?error=Solo%20puedes%20adjuntar%20documentos%20a%20pacientes%20validos.");
  }

  const fileBuffer = new Uint8Array(await file.arrayBuffer());

  await prisma.patientDocument.create({
    data: {
      userId,
      category: category as PatientDocumentCategory,
      title,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      fileData: fileBuffer,
      uploadedByRole: UserRole.ADMIN
    }
  });

  revalidatePath(`/admin/patients/${userId}`);
  revalidatePath("/patient");
  redirectToPatientEditorWithSuccess(userId, "Documento cargado correctamente.");
}

export async function deletePatientDocumentAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);

  const documentId = getField(formData, "documentId");
  const userId = getField(formData, "userId");

  if (!documentId || !userId) {
    redirect("/admin?error=No%20pudimos%20identificar%20el%20documento.");
  }

  await prisma.patientDocument.deleteMany({
    where: {
      id: documentId,
      userId
    }
  });

  revalidatePath(`/admin/patients/${userId}`);
  revalidatePath("/patient");
  redirectToPatientEditorWithSuccess(userId, "Documento eliminado correctamente.");
}

export async function createAvailabilitySlotAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);

  const result = availabilitySlotSchema.safeParse({
    dayOfWeek: getField(formData, "dayOfWeek"),
    startTime: getField(formData, "startTime"),
    endTime: getField(formData, "endTime")
  });

  if (!result.success) {
    redirect(`/admin?error=${encodeURIComponent(result.error.issues[0]?.message ?? "No pudimos guardar la disponibilidad.")}`);
  }

  const parsed = result.data;

  await prisma.availabilitySlot.create({
    data: {
      dayOfWeek: parsed.dayOfWeek as WeekDay,
      startTime: parsed.startTime,
      endTime: parsed.endTime
    }
  });

  revalidatePath("/admin");
  redirect("/admin?success=Disponibilidad%20guardada%20correctamente.");
}

export async function deleteAvailabilitySlotAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);

  const slotId = getField(formData, "slotId");

  if (!slotId) {
    redirect("/admin?error=No%20pudimos%20identificar%20el%20bloque%20de%20disponibilidad.");
  }

  await prisma.availabilitySlot.deleteMany({
    where: { id: slotId }
  });

  revalidatePath("/admin");
  redirect("/admin?success=Disponibilidad%20eliminada%20correctamente.");
}

export async function createRecipeAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);

  const title = getField(formData, "title").trim();
  const mealType = getField(formData, "mealType").trim();
  const description = getField(formData, "description").trim();
  const imageUrl = getOptionalField(formData, "imageUrl");
  const prepMinutes = Number(getField(formData, "prepMinutes"));

  if (!title || title.length < 4) {
    redirect("/admin/recipes?error=Escribe%20un%20nombre%20claro%20para%20la%20receta.");
  }

  if (!mealType) {
    redirect("/admin/recipes?error=Selecciona%20el%20tiempo%20de%20comida.");
  }

  if (!description || description.length < 8) {
    redirect("/admin/recipes?error=Agrega%20una%20descripcion%20breve%20de%20la%20receta.");
  }

  if (!Number.isFinite(prepMinutes) || prepMinutes < 1 || prepMinutes > 240) {
    redirect("/admin/recipes?error=El%20tiempo%20de%20preparacion%20debe%20ser%20valido.");
  }

  const foodGroups = await prisma.foodGroup.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true
    }
  });
  const equivalents = foodGroups
    .map((group) => ({
      foodGroupId: group.id,
      amount: Number(getField(formData, `equivalent_${group.slug}`))
    }))
    .filter((equivalent) => Number.isFinite(equivalent.amount) && equivalent.amount > 0);

  if (!equivalents.length) {
    redirect("/admin/recipes?error=Agrega%20al%20menos%20un%20equivalente%20a%20la%20receta.");
  }

  await prisma.recipe.create({
    data: {
      title,
      mealType,
      description,
      imageUrl,
      prepMinutes,
      equivalents: {
        create: equivalents
      }
    }
  });

  revalidatePath("/admin/recipes");
  redirect(`/admin/recipes?mealType=${encodeURIComponent(mealType)}&success=Receta%20guardada%20correctamente.`);
}

export async function createAppointmentByAdminAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);

  const result = adminAppointmentCreateSchema.safeParse({
    userId: getField(formData, "userId"),
    type: getField(formData, "type"),
    scheduledAt: getField(formData, "scheduledAt"),
    notes: getOptionalField(formData, "notes"),
    isFlexibleRequest: formData.get("isFlexibleRequest") === "on"
  });

  if (!result.success) {
    redirect(`/admin?error=${encodeURIComponent(result.error.issues[0]?.message ?? "No pudimos crear la cita.")}`);
  }

  const parsed = result.data;
  const scheduledAt = parseDateTimeLocal(parsed.scheduledAt);

  if (!scheduledAt) {
    redirect("/admin?error=La%20fecha%20y%20hora%20de%20la%20cita%20no%20es%20valida.");
  }

  await prisma.appointment.create({
    data: {
      userId: parsed.userId,
      type: parsed.type,
      status: AppointmentStatus.CONFIRMED,
      scheduledAt,
      durationMinutes: getAppointmentDuration(parsed.type),
      notes: parsed.notes,
      isFlexibleRequest: parsed.isFlexibleRequest ?? false,
      createdByRole: UserRole.ADMIN
    }
  });

  revalidatePath("/admin");
  revalidatePath("/patient");
  redirect("/admin?success=Cita%20creada%20correctamente.");
}

export async function requestAppointmentAction(formData: FormData) {
  const session = await requireRole(UserRole.PATIENT);

  const result = patientAppointmentRequestSchema.safeParse({
    type: getField(formData, "type"),
    scheduledAt: getField(formData, "scheduledAt"),
    notes: getOptionalField(formData, "notes"),
    isFlexibleRequest: formData.get("isFlexibleRequest") === "on"
  });

  if (!result.success) {
    redirect(`/patient?error=${encodeURIComponent(result.error.issues[0]?.message ?? "No pudimos solicitar la cita.")}`);
  }

  const parsed = result.data;
  const scheduledAt = parseDateTimeLocal(parsed.scheduledAt);

  if (!scheduledAt) {
    redirect("/patient?error=La%20fecha%20y%20hora%20solicitada%20no%20es%20valida.");
  }

  await prisma.appointment.create({
    data: {
      userId: session.userId,
      type: parsed.type,
      status: AppointmentStatus.REQUESTED,
      scheduledAt,
      durationMinutes: getAppointmentDuration(parsed.type),
      notes: parsed.notes,
      isFlexibleRequest: parsed.isFlexibleRequest ?? false,
      createdByRole: UserRole.PATIENT
    }
  });

  revalidatePath("/patient");
  revalidatePath("/admin");
  redirect("/patient?success=Cita%20solicitada%20correctamente.");
}

export async function updateAppointmentStatusAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);

  const result = appointmentStatusUpdateSchema.safeParse({
    appointmentId: getField(formData, "appointmentId"),
    status: getField(formData, "status")
  });

  if (!result.success) {
    redirect(`/admin?error=${encodeURIComponent(result.error.issues[0]?.message ?? "No pudimos actualizar la cita.")}`);
  }

  const parsed = result.data;

  await prisma.appointment.update({
    where: { id: parsed.appointmentId },
    data: {
      status: parsed.status,
      requestedScheduledAt: null,
      requestedChangeNote: null
    }
  });

  revalidatePath("/admin");
  revalidatePath("/patient");
  redirect("/admin?success=Estatus%20de%20cita%20actualizado.");
}

export async function requestAppointmentRescheduleAction(formData: FormData) {
  const session = await requireRole(UserRole.PATIENT);

  const result = appointmentRescheduleRequestSchema.safeParse({
    appointmentId: getField(formData, "appointmentId"),
    requestedScheduledAt: getField(formData, "requestedScheduledAt"),
    requestedChangeNote: getOptionalField(formData, "requestedChangeNote")
  });

  if (!result.success) {
    redirect(`/patient?error=${encodeURIComponent(result.error.issues[0]?.message ?? "No pudimos solicitar la reprogramacion.")}`);
  }

  const parsed = result.data;
  const requestedScheduledAt = parseDateTimeLocal(parsed.requestedScheduledAt);

  if (!requestedScheduledAt) {
    redirect("/patient?error=La%20nueva%20fecha%20solicitada%20no%20es%20valida.");
  }

  await prisma.appointment.updateMany({
    where: {
      id: parsed.appointmentId,
      userId: session.userId
    },
    data: {
      status: AppointmentStatus.RESCHEDULE_REQUESTED,
      requestedScheduledAt,
      requestedChangeNote: parsed.requestedChangeNote
    }
  });

  revalidatePath("/patient");
  revalidatePath("/admin");
  redirect("/patient?success=Reprogramacion%20solicitada%20correctamente.");
}

export async function updatePatientAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);

  const result = adminPatientUpdateSchema.safeParse({
    userId: getField(formData, "userId"),
    fullName: getField(formData, "fullName"),
    email: getField(formData, "email"),
    phone: getOptionalField(formData, "phone"),
    birthDate: getOptionalField(formData, "birthDate"),
    biologicalSex: getOptionalField(formData, "biologicalSex"),
    heightCm: getOptionalField(formData, "heightCm"),
    initialWeightKg: getOptionalField(formData, "initialWeightKg"),
    currentWeightKg: getOptionalField(formData, "currentWeightKg"),
    previousDietExperience: getOptionalField(formData, "previousDietExperience"),
    previousDietDuration: getOptionalField(formData, "previousDietDuration"),
    physicalActivityLevel: getOptionalField(formData, "physicalActivityLevel"),
    status: getOptionalField(formData, "status"),
    careType: getOptionalField(formData, "careType"),
    planDuration: getOptionalField(formData, "planDuration"),
    contactSchedule: getOptionalField(formData, "contactSchedule"),
    medications: getOptionalField(formData, "medications"),
    foodAllergies: getOptionalField(formData, "foodAllergies"),
    goal: getOptionalField(formData, "goal"),
    notes: getOptionalField(formData, "notes")
  });

  if (!result.success) {
    redirect(
      `/admin/patients/${encodeURIComponent(getField(formData, "userId"))}?error=${encodeURIComponent(
        result.error.issues[0]?.message ?? "No pudimos actualizar al paciente."
      )}`
    );
  }

  const parsed = result.data;

  if (resolveUserRole(parsed.email) === UserRole.ADMIN) {
    redirect(
      `/admin/patients/${encodeURIComponent(parsed.userId)}?error=${encodeURIComponent(
        "Ese correo pertenece a un administrador configurado en ADMIN_EMAILS."
      )}`
    );
  }

  const heightCm = parseOptionalFloat(parsed.heightCm);
  const initialWeightKg = parseOptionalFloat(parsed.initialWeightKg);
  const currentWeightKg = parseOptionalFloat(parsed.currentWeightKg);

  if (Number.isNaN(heightCm) || Number.isNaN(initialWeightKg) || Number.isNaN(currentWeightKg)) {
    redirect(
      `/admin/patients/${encodeURIComponent(parsed.userId)}?error=${encodeURIComponent(
        "Altura, peso inicial y peso actual deben ser numeros validos."
      )}`
    );
  }

  const birthDate = parsed.birthDate ? new Date(`${parsed.birthDate}T00:00:00`) : undefined;

  if (birthDate && Number.isNaN(birthDate.getTime())) {
    redirect(
      `/admin/patients/${encodeURIComponent(parsed.userId)}?error=${encodeURIComponent(
        "La fecha de nacimiento no es valida."
      )}`
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: {
      id: true,
      role: true
    }
  });

  if (!existingUser) {
    redirect("/admin?error=El%20paciente%20que%20quieres%20editar%20ya%20no%20existe.");
  }

  if (existingUser.role !== UserRole.PATIENT) {
    redirect("/admin?error=Solo%20puedes%20editar%20cuentas%20de%20paciente.");
  }

  try {
    await prisma.user.update({
      where: { id: parsed.userId },
      data: {
        fullName: parsed.fullName,
        email: parsed.email,
        profile: {
          upsert: {
            create: {
              phone: parsed.phone,
              birthDate,
              biologicalSex: parsed.biologicalSex,
              heightCm,
              initialWeightKg,
              currentWeightKg,
              previousDietExperience:
                parsed.previousDietExperience === undefined
                  ? undefined
                  : parsed.previousDietExperience === "yes",
              previousDietDuration:
                parsed.previousDietExperience === "yes" ? parsed.previousDietDuration : undefined,
              physicalActivityLevel: parsed.physicalActivityLevel,
              status: parsed.status,
              careType: parsed.careType,
              planDuration: parsed.planDuration,
              contactSchedule: parsed.contactSchedule,
              medications: parsed.medications,
              foodAllergies: parsed.foodAllergies,
              goal: parsed.goal,
              notes: parsed.notes
            },
            update: {
              phone: parsed.phone,
              birthDate,
              biologicalSex: parsed.biologicalSex,
              heightCm,
              initialWeightKg,
              currentWeightKg,
              previousDietExperience:
                parsed.previousDietExperience === undefined
                  ? undefined
                  : parsed.previousDietExperience === "yes",
              previousDietDuration:
                parsed.previousDietExperience === "yes" ? parsed.previousDietDuration : null,
              physicalActivityLevel: parsed.physicalActivityLevel,
              status: parsed.status,
              careType: parsed.careType,
              planDuration: parsed.planDuration,
              contactSchedule: parsed.contactSchedule,
              medications: parsed.medications,
              foodAllergies: parsed.foodAllergies,
              goal: parsed.goal,
              notes: parsed.notes
            }
          }
        }
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(
        `/admin/patients/${encodeURIComponent(parsed.userId)}?error=${encodeURIComponent(
          "Ya existe otro usuario con ese correo."
        )}`
      );
    }

    throw error;
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/patients/${parsed.userId}`);
  revalidatePath("/patient");
  redirect(`/admin/patients/${encodeURIComponent(parsed.userId)}?success=Paciente%20actualizado%20correctamente.`);
}

export async function changePasswordAction(formData: FormData) {
  const session = await requireUser();

  const result = changePasswordSchema.safeParse({
    password: getField(formData, "password"),
    confirmPassword: getField(formData, "confirmPassword")
  });

  if (!result.success) {
    redirect(
      `/change-password?error=${encodeURIComponent(
        result.error.issues[0]?.message ?? "No pudimos actualizar tu contrasena."
      )}`
    );
  }

  const parsed = result.data;

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      passwordHash: await bcrypt.hash(parsed.password, 12),
      mustChangePassword: false
    }
  });

  await createSession({
    sub: session.userId,
    role: session.role,
    email: session.email,
    fullName: session.fullName,
    mustChangePassword: false
  });

  redirect(getDefaultDashboardPath(session.role));
}
