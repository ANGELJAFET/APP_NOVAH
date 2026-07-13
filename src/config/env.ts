import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  db: {
    host: required("DB_HOST", "localhost"),
    port: Number(process.env.DB_PORT ?? 3306),
    user: required("DB_USER", "root"),
    password: process.env.DB_PASSWORD ?? "",
    database: required("DB_NAME", "prueba_practica_pilv"),
  },
  jwt: {
    secret: required("JWT_SECRET", "change-this-secret"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  },
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
};
