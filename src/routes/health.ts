import type { FastifyInstance } from "fastify";

/**
 * Health check endpoint.
 * @param app - Fastify instance.
 * @returns A promise that resolves to the health check response.
 */
export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_request, reply) => {
    return reply.send({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/", async (_request, reply) => {
    return reply.send({
      name: "Bedrock Ping API",
      description: "Minecraft Bedrock Edition server ping API",
      version: "1.0.0",
      endpoints: {
        "GET /ping": {
          description: "Ping a Bedrock server and retrieve its status",
          parameters: {
            hostname: { required: true, type: "string", example: "play.example.com" },
            port: {
              required: false,
              type: "number",
              default: 19132,
              example: 19132,
            },
          },
        },
        "GET /health": { description: "Health check" },
      },
      source: "https://github.com/smell-of-curry/bedrock-ping",
    });
  });
}
