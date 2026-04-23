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
1. Copia `.env.example` a `.env.local` para desarrollo en Next.js
2. Configura:
- `DATABASE_URL`
- `SESSION_SECRET`

## Primer arranque con PostgreSQL
1. Si quieres levantar PostgreSQL local con Docker:
- Ejecuta `docker compose up -d`
2. Si ya tienes PostgreSQL local o remoto:
- Crea una base llamada `alahy_nutrition` o ajusta el nombre en `DATABASE_URL`
3. Copia `.env.example` a `.env.local`
4. Genera un secreto seguro para `SESSION_SECRET`
5. Ejecuta `npm install`
6. Ejecuta `npm run prisma:generate`
7. Ejecuta `npm run prisma:migrate -- --name init`
8. Ejecuta `npm run dev`

## Conexion esperada
- Local con Docker: `postgresql://postgres:postgres@localhost:5432/alahy_nutrition?schema=public`
- Supabase/Neon/Railway: usa la cadena PostgreSQL que te entregue el proveedor

## Notas de la fase 2
- Si falta `DATABASE_URL` o `SESSION_SECRET`, la app ahora lo indicara con un error claro
- Si PostgreSQL no esta listo, el registro y login mostraran un mensaje de configuracion en lugar de romper la experiencia

## Rutas nuevas
- `/register`
- `/login`
- `/dashboard`
