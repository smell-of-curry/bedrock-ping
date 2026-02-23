import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { config } from "./config/env";
import { pingRoutes } from "./routes/ping";
import { healthRoutes } from "./routes/health";
import { AppError } from "./lib/errors";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors);
  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindowMs,
  });

  app.setErrorHandler((error: FastifyError | AppError, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
      });
    }

    if ("validation" in error && error.validation) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: error.message,
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      error: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    });
  });

  await app.register(pingRoutes);
  await app.register(healthRoutes);

  return app;
}
