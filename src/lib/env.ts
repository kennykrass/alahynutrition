function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured. Check your .env or .env.local file.`);
  }

  return value;
}

export function getDatabaseUrl() {
  return requireEnv("DATABASE_URL");
}

export function getSessionSecret() {
  return requireEnv("SESSION_SECRET");
}

export function getAdminEmails() {
  const value = process.env.ADMIN_EMAILS;

  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
