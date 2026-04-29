CREATE TYPE "BiologicalSex" AS ENUM ('MALE', 'FEMALE');

CREATE TYPE "PhysicalActivityLevel" AS ENUM ('NONE', 'LIGHT', 'MODERATE', 'INTENSE');

CREATE TYPE "PatientStatus" AS ENUM ('NEW', 'ACTIVE', 'PENDING', 'ARCHIVED', 'EXPIRED');

CREATE TYPE "CareType" AS ENUM ('INITIAL', 'FOLLOW_UP', 'RESTART');

CREATE TYPE "PlanDuration" AS ENUM ('ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'CUSTOM');

ALTER TABLE "PatientProfile"
ADD COLUMN "acceptedPrivacyAt" TIMESTAMP(3),
ADD COLUMN "biologicalSex" "BiologicalSex",
ADD COLUMN "careType" "CareType",
ADD COLUMN "contactSchedule" TEXT,
ADD COLUMN "currentWeightKg" DOUBLE PRECISION,
ADD COLUMN "foodAllergies" TEXT,
ADD COLUMN "medications" TEXT,
ADD COLUMN "patientCode" TEXT,
ADD COLUMN "physicalActivityLevel" "PhysicalActivityLevel",
ADD COLUMN "planDuration" "PlanDuration",
ADD COLUMN "previousDietDuration" TEXT,
ADD COLUMN "previousDietExperience" BOOLEAN,
ADD COLUMN "status" "PatientStatus" NOT NULL DEFAULT 'NEW';

CREATE UNIQUE INDEX "PatientProfile_patientCode_key" ON "PatientProfile"("patientCode");
