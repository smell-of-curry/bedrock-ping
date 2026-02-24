import { describe, it, expect, afterAll } from "vitest";
import { buildApp } from "../../src/app";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

afterAll(async () => {
  await app.close();
});

describe("app error handler", () => {
  it("returns 400 with VALIDATION_ERROR for Fastify schema validation errors", async () => {
    app = await buildApp();

    app.get("/test-validation", {
      schema: {
        querystring: {
          type: "object",
          required: ["required_field"],
          properties: { required_field: { type: "string" } },
        },
      },
      handler: async () => ({ ok: true }),
    });

    await app.ready();

    const res = await app.inject({ method: "GET", url: "/test-validation" });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe("VALIDATION_ERROR");
  });

  it("returns 500 for unexpected errors", async () => {
    app = await buildApp();

    app.get("/test-throw", async () => {
      throw new Error("unexpected boom");
    });

    await app.ready();

    const res = await app.inject({ method: "GET", url: "/test-throw" });
    expect(res.statusCode).toBe(500);
    const body = res.json();
    expect(body.error).toBe("INTERNAL_ERROR");
    expect(body.message).toBe("An unexpected error occurred");
  });
});
