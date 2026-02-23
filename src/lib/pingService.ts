import dns from "node:dns/promises";
import { config } from "../config/env";
import { DnsLookupError, PingTimeoutError, PingError } from "../lib/errors";
import { pingServer } from "../lib/raknetClient";
import type { RakNetPongData, PingResult } from "../types";

/**
 * Verify that {@link hostname} resolves to an IPv4 address.
 *
 * Called before the UDP ping so that callers receive a clear
 * {@link DnsLookupError} (HTTP 422) instead of a generic socket failure.
 *
 * @param hostname - The hostname to resolve.
 * @throws {DnsLookupError} If DNS resolution fails.
 */
async function resolveDns(hostname: string): Promise<void> {
  try {
    await dns.lookup(hostname, 4);
  } catch {
    throw new DnsLookupError(hostname);
  }
}

/**
 * Map a raw {@link RakNetPongData} payload into the public {@link PingResult}
 * shape, attaching the original request parameters and a timestamp.
 *
 * @param hostname - The hostname that was queried.
 * @param port     - The port that was queried.
 * @param pong     - Parsed pong data from the RakNet client.
 * @returns A {@link PingResult} ready to be serialized as JSON.
 */
function mapPongToResult(hostname: string, port: number, pong: RakNetPongData): PingResult {
  return {
    hostname,
    port,
    version: pong.version,
    protocolVersion: pong.protocolVersion,
    onlinePlayers: pong.onlinePlayers,
    maxPlayers: pong.maxPlayers,
    motd: pong.motd,
    subMotd: pong.subMotd,
    gameMode: pong.gameMode,
    serverUniqueId: pong.serverUniqueId,
    edition: pong.edition,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Ping a Minecraft Bedrock server and return its current status.
 *
 * 1. Resolves the hostname via DNS (IPv4).
 * 2. Sends a RakNet unconnected ping over UDP.
 * 3. Maps the pong response into a {@link PingResult}.
 *
 * @param hostname - Target server hostname or IP address.
 * @param port     - Target server UDP port.
 * @returns A promise resolving to the server's parsed status.
 * @throws {DnsLookupError}    If the hostname cannot be resolved.
 * @throws {PingTimeoutError}  If the server does not respond in time.
 * @throws {PingError}         If the ping fails for any other reason.
 */
export async function ping(hostname: string, port: number): Promise<PingResult> {
  await resolveDns(hostname);

  try {
    const pong = await pingServer(hostname, port, config.pingTimeoutMs);
    return mapPongToResult(hostname, port, pong);
  } catch (err) {
    if (err instanceof Error && err.message === "Ping timed out") {
      throw new PingTimeoutError(hostname, port);
    }
    throw new PingError(err instanceof Error ? err.message : "Unknown error while pinging server");
  }
}
