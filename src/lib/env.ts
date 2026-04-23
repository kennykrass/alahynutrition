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
