import "dotenv/config";
import mysql, { type Pool } from "mysql2/promise";

function getEnv(name: string): string {
  const value = process.env[name];

  if (value === undefined) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const db: Pool = mysql.createPool({
  host: getEnv("DB_HOST"),
  port: Number(process.env.DB_PORT ?? 3306),
  user: getEnv("DB_USER"),
  password: getEnv("DB_PASSWORD"),
  database: getEnv("DB_NAME"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});