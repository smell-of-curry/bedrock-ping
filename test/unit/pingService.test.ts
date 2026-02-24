import { describe, it, expect, vi } from "vitest";
import { DnsLookupError, PingTimeoutError, PingError } from "../../src/lib/errors";

vi.mock("node:dns/promises", () => ({
  default: { lookup: vi.fn() },
}));

vi.mock("../../src/lib/raknetClient", () => ({
  pingServer: vi.fn(),
}));

import dns from "node:dns/promises";
import { pingServer } from "../../src/lib/raknetClient";
import { ping } from "../../src/lib/pingService";

const mockedDns = vi.mocked(dns.lookup);
const mockedPingServer = vi.mocked(pingServer);

describe("ping service", () => {
  it("throws DnsLookupError when DNS resolution fails", async () => {
    mockedDns.mockRejectedValueOnce(new Error("getaddrinfo ENOTFOUND"));

    await expect(ping("bad.invalid", 19132)).rejects.toBeInstanceOf(DnsLookupError);
  });

  it("maps 'Ping timed out' to PingTimeoutError", async () => {
    mockedDns.mockResolvedValueOnce({ address: "1.2.3.4", family: 4 } as never);
    mockedPingServer.mockRejectedValueOnce(new Error("Ping timed out"));

    await expect(ping("slow.example.com", 19132)).rejects.toBeInstanceOf(PingTimeoutError);
  });

  it("maps other errors to PingError", async () => {
    mockedDns.mockResolvedValueOnce({ address: "1.2.3.4", family: 4 } as never);
    mockedPingServer.mockRejectedValueOnce(new Error("Socket destroyed"));

    await expect(ping("broken.example.com", 19132)).rejects.toBeInstanceOf(PingError);
    await expect(ping("broken.example.com", 19132)).rejects.not.toBeInstanceOf(PingTimeoutError);
  });

  it("wraps non-Error throwables in PingError with generic message", async () => {
    mockedDns.mockResolvedValueOnce({ address: "1.2.3.4", family: 4 } as never);
    mockedPingServer.mockRejectedValueOnce("string-error");

    const err: PingError = await ping("x.com", 19132).catch((e) => e);
    expect(err).toBeInstanceOf(PingError);
    expect(err.message).toBe("Unknown error while pinging server");
  });

  it("returns a PingResult on success", async () => {
    mockedDns.mockResolvedValueOnce({ address: "1.2.3.4", family: 4 } as never);
    mockedPingServer.mockResolvedValueOnce({
      raw: "MCPE;Test;685;26.0.1;5;20;123;Sub;Survival;1;19132;19133",
      edition: "MCPE",
      motd: "Test",
      protocolVersion: "685",
      version: "26.0.1",
      onlinePlayers: 5,
      maxPlayers: 20,
      serverUniqueId: "123",
      subMotd: "Sub",
      gameMode: "Survival",
      gameModeNumeric: 1,
      portIPv4: 19132,
      portIPv6: 19133,
    });

    const result = await ping("example.com", 19132);
    expect(result.hostname).toBe("example.com");
    expect(result.port).toBe(19132);
    expect(result.version).toBe("26.0.1");
    expect(result.timestamp).toBeDefined();
  });
});
