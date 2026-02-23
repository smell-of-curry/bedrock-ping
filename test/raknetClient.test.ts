import { describe, it, expect } from "vitest";
import { parseServerInfo } from "../src/lib/raknetClient";

describe("parseServerInfo", () => {
  it("parses a full Bedrock server info string", () => {
    const raw =
      "MCPE;My Server;685;26.0.1;3;20;12345678901234567;A Bedrock Server;Survival;1;19132;19133";
    const result = parseServerInfo(raw);

    expect(result.raw).toBe(raw);
    expect(result.edition).toBe("MCPE");
    expect(result.motd).toBe("My Server");
    expect(result.protocolVersion).toBe("685");
    expect(result.version).toBe("26.0.1");
    expect(result.onlinePlayers).toBe(3);
    expect(result.maxPlayers).toBe(20);
    expect(result.serverUniqueId).toBe("12345678901234567");
    expect(result.subMotd).toBe("A Bedrock Server");
    expect(result.gameMode).toBe("Survival");
    expect(result.gameModeNumeric).toBe(1);
    expect(result.portIPv4).toBe(19132);
    expect(result.portIPv6).toBe(19133);
  });

  it("handles missing trailing fields gracefully", () => {
    const raw = "MCPE;Short Server;685;26.0.1;5;10";
    const result = parseServerInfo(raw);

    expect(result.edition).toBe("MCPE");
    expect(result.motd).toBe("Short Server");
    expect(result.onlinePlayers).toBe(5);
    expect(result.maxPlayers).toBe(10);
    expect(result.serverUniqueId).toBe("unknown");
    expect(result.subMotd).toBe("");
    expect(result.gameMode).toBe("unknown");
  });

  it("handles an empty string", () => {
    const result = parseServerInfo("");

    expect(result.edition).toBe("");
    expect(result.motd).toBe("unknown");
    expect(result.onlinePlayers).toBe(0);
  });

  it("handles non-numeric player counts", () => {
    const raw = "MCPE;Test;685;1.0.0;abc;xyz";
    const result = parseServerInfo(raw);

    expect(result.onlinePlayers).toBeNaN();
    expect(result.maxPlayers).toBeNaN();
  });
});
