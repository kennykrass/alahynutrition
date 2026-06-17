import {
  BiologicalSex,
  CareType,
  PatientStatus,
  PhysicalActivityLevel,
  PlanDuration,
  UserRole
} from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

const DEMO_EMAIL = "demo.clinico@alahynutrition.com";
const DEMO_NOTES = {
  disease: "Sin diagnostico cronico reportado",
  medicationNameDose: "Multivitaminico ocasional",
  alcohol: "Social, 1 vez por semana",
  tobacco: "No",
  generalCondition: "Aspecto general normal",
  comments: "Paciente demo para visualizar y editar historia clinica."
};

export async function ensureClinicalDemoPatient() {
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: {
      profile: true,
      entries: {
        take: 1
      }
    }
  });

  if (!existing) {
    return prisma.user.create({
      data: {
        fullName: "Erick Leija Arriaga",
        email: DEMO_EMAIL,
        passwordHash: await bcrypt.hash("AlahyDemo123", 12),
        mustChangePassword: true,
        role: UserRole.PATIENT,
        profile: {
          create: {
            patientCode: "DEMO-CLINICO",
            phone: "81 0000 0000",
            birthDate: new Date("1995-06-17T00:00:00"),
            biologicalSex: BiologicalSex.MALE,
            heightCm: 163,
            initialWeightKg: 76,
            currentWeightKg: 76,
            previousDietExperience: true,
            previousDietDuration: "3 meses con plan general.",
            physicalActivityLevel: PhysicalActivityLevel.LIGHT,
            status: PatientStatus.ACTIVE,
            careType: CareType.INITIAL,
            planDuration: PlanDuration.THREE_MONTHS,
            medications: "Multivitaminico ocasional",
            foodAllergies: "Sin alergias reportadas",
            goal: "Disminuir peso",
            notes: JSON.stringify(DEMO_NOTES)
          }
        },
        entries: {
          create: {
            loggedAt: new Date("2026-06-17T12:00:00"),
            weightKg: 76,
            waistCm: 100,
            bodyFatPct: 21,
            notes: "Registro inicial demo"
          }
        }
      }
    });
  }

  if (!existing.profile) {
    await prisma.patientProfile.create({
      data: {
        userId: existing.id,
        patientCode: "DEMO-CLINICO",
        phone: "81 0000 0000",
        birthDate: new Date("1995-06-17T00:00:00"),
        biologicalSex: BiologicalSex.MALE,
        heightCm: 163,
        initialWeightKg: 76,
        currentWeightKg: 76,
        previousDietExperience: true,
        previousDietDuration: "3 meses con plan general.",
        physicalActivityLevel: PhysicalActivityLevel.LIGHT,
        status: PatientStatus.ACTIVE,
        careType: CareType.INITIAL,
        planDuration: PlanDuration.THREE_MONTHS,
        medications: "Multivitaminico ocasional",
        foodAllergies: "Sin alergias reportadas",
        goal: "Disminuir peso",
        notes: JSON.stringify(DEMO_NOTES)
      }
    });
  }

  if (existing.entries.length === 0) {
    await prisma.progressEntry.create({
      data: {
        userId: existing.id,
        loggedAt: new Date("2026-06-17T12:00:00"),
        weightKg: 76,
        waistCm: 100,
        bodyFatPct: 21,
        notes: "Registro inicial demo"
      }
    });
  }

  return existing;
}
