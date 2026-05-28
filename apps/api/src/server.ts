import dotenv from "dotenv";
import fastify from "fastify";
import cors from "@fastify/cors";
import { healthRoutes } from "./routes/health";
import { dbTestRoutes } from "./routes/db-test";

dotenv.config();

const app = fastify({ logger: true });
const port = Number(process.env.PORT ?? 4000);

const start = async () => {
  try {
    await app.register(cors, { origin: true });
    await app.register(healthRoutes);
    await app.register(dbTestRoutes);

    app.get("/", async () => {
      return "Phantoria API is running";
    });

    await app.listen({ port, host: "0.0.0.0" });
    console.log(`API listening on http://localhost:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();