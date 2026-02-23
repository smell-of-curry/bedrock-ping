import type { FastifyInstance } from "fastify";
import type { PingQuery } from "../types";
import { ValidationError } from "../lib/errors";
import { config } from "../config/env";
import { HOSTNAME_PATTERN, MIN_PORT, MAX_PORT } from "../config/ping";
import { ping } from "../lib/pingService";

/**
 * Validate and normalize the `hostname` query parameter.
 *
 * @param raw - The raw query-string value (may be `undefined`).
 * @returns The trimmed, validated hostname string.
 * @throws {ValidationError} If the value is missing or contains illegal characters.
 */
function validateHostname(raw: string | undefined): string {
  if (!raw || raw.trim().length === 0) {
    throw new ValidationError("Query parameter 'hostname' is required");
  }
  const hostname = raw.trim();
  if (!HOSTNAME_PATTERN.test(hostname)) {
    throw new ValidationError(
      `Invalid hostname "${hostname}". Must contain only alphanumeric characters, dots, hyphens, and underscores.`,
    );
  }
  return hostname;
}

/**
 * Validate and parse the optional `port` query parameter.
 *
 * Falls back to {@link config.defaultBedrockPort} when the parameter is omitted.
 *
 * @param raw - The raw query-string value (may be `undefined` or `""`).
 * @returns A valid integer port in the range [{@link MIN_PORT}, {@link MAX_PORT}].
 * @throws {ValidationError} If the value is non-numeric or out of range.
 */
function validatePort(raw: string | undefined): number {
  if (raw === undefined || raw === "") return config.defaultBedrockPort;

  const port = parseInt(raw, 10);
  if (Number.isNaN(port) || port < MIN_PORT || port > MAX_PORT) 
    throw new ValidationError(`Port must be an integer between ${MIN_PORT} and ${MAX_PORT}`);
  return port;
}

/**
 * Register the `GET /ping` route on the given Fastify instance.
 *
 * @param app - The Fastify application to register routes on.
 */
export async function pingRoutes(app: FastifyInstance) {
  app.get<{ Querystring: PingQuery }>("/ping", async (request, reply) => {
    const hostname = validateHostname(request.query.hostname);
    const port = validatePort(request.query.port);
    const result = await ping(hostname, port);
    return reply.send(result);
  });
}
