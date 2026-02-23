import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../../src/app";
import type { FastifyInstance } from "fastify";

/**
 * Full end-to-end tests that boot the real Fastify app and issue real HTTP
 * requests via Fastify's inject helper (in-process, no network port needed).
 *
 * The "live ping" test targets a well-known public Bedrock server. It is
 * guarded by the RUN_LIVE_TESTS env var so CI can opt out if UDP traffic
 * is blocked.
 */

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("E2E: health and root", () => {
  it("GET / returns API info with endpoints list", async () => {
    const res = await app.inject({ method: "GET", url: "/" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.name).toBe("Bedrock Ping API");
    expect(body.endpoints["GET /ping"].parameters.hostname.required).toBe(true);
  });

  it("GET /health returns ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("ok");
  });
});

describe("E2E: /ping validation", () => {
  it("rejects missing hostname", async () => {
    const res = await app.inject({ method: "GET", url: "/ping" });
    expect(res.statusCode).toBe(400);
  });

  it("rejects hostname with spaces", async () => {
    const res = await app.inject({ method: "GET", url: "/ping?hostname=has%20space" });
    expect(res.statusCode).toBe(400);
  });

  it("rejects port 0", async () => {
    const res = await app.inject({ method: "GET", url: "/ping?hostname=x.com&port=0" });
    expect(res.statusCode).toBe(400);
  });

  it("rejects port 70000", async () => {
    const res = await app.inject({ method: "GET", url: "/ping?hostname=x.com&port=70000" });
    expect(res.statusCode).toBe(400);
  });

  it("uses default port when omitted", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/ping?hostname=does-not-exist-at-all.invalid",
    });
    expect(res.statusCode).toBe(422);
  });
});

describe("E2E: /ping DNS failures", () => {
  it("returns 422 for non-existent domain", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/ping?hostname=nxdomain-test-host.invalid",
    });
    expect(res.statusCode).toBe(422);
    expect(res.json().error).toBe("DNS_LOOKUP_FAILED");
  });
});

describe("E2E: /ping live network", () => {
  const runLive = process.env.RUN_LIVE_TESTS === "true";

  it.skipIf(!runLive)("pings a public Bedrock server successfully", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/ping?hostname=play.pokebedrock.com&port=19132",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.hostname).toBe("play.pokebedrock.com");
    expect(body.port).toBe(19132);
    expect(body.version).toBeDefined();
    expect(typeof body.onlinePlayers).toBe("number");
    expect(typeof body.maxPlayers).toBe("number");
    expect(body.edition).toBe("MCPE");
    expect(body.timestamp).toBeDefined();
  });
});
