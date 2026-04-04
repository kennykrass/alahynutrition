# Alahy Nutrition

Sitio web para el nutriologo Erick David Alahy Rios Cervantes.

## Requisitos
- Node.js 18.17 o superior
- PostgreSQL disponible local o remoto

## Scripts
- npm run dev
- npm run build
- npm run start
- npm run prisma:generate
- npm run prisma:migrate
- npm run prisma:studio

## Notas
Este proyecto usa Next.js + Tailwind CSS y el App Router.

## Fase 2
La base del portal de pacientes ya incluye:
- Registro de pacientes
- Login con sesion por cookie segura
- Dashboard protegido
- Prisma con modelos `User`, `PatientProfile` y `ProgressEntry`

## Variables de entorno
1. Copia `.env.example` a `.env`
2. Configura:
- `DATABASE_URL`
- `SESSION_SECRET`

## Primer arranque con PostgreSQL
1. Crea una base llamada `alahy_nutrition` o ajusta el nombre en `DATABASE_URL`
2. Ejecuta `npm run prisma:generate`
3. Ejecuta `npm run prisma:migrate -- --name init`
4. Ejecuta `npm run dev`

## Rutas nuevas
- `/register`
- `/login`
- `/dashboard`
