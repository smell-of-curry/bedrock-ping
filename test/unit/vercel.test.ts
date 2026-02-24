import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "node:events";

const mockApp = {
  ready: vi.fn().mockResolvedValue(undefined),
  server: new EventEmitter(),
};

vi.mock("../../src/app", () => ({
  buildApp: vi.fn().mockResolvedValue(mockApp),
}));

describe("vercel handler", () => {
  it("boots the app, emits request, and reuses the instance", async () => {
    const emitSpy = vi.spyOn(mockApp.server, "emit");
    const { default: handler } = await import("../../src/vercel");
    const { buildApp } = await import("../../src/app");

    const req1 = {} as never;
    const res1 = {} as never;
    await handler(req1, res1);

    expect(mockApp.ready).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith("request", req1, res1);

    await handler({} as never, {} as never);
    expect(buildApp).toHaveBeenCalledTimes(1);
  });
});
