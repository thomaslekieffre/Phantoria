import type { FastifyInstance } from "fastify";
import { db } from "../lib/db";

export async function dbTestRoutes(app: FastifyInstance) {
  app.get("/db-test", async () => {
    const [rows] = await db.query("SELECT 1 AS ok");
    return { ok: true, rows };
  });
}