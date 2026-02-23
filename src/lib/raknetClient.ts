import dgram from "node:dgram";
import crypto from "node:crypto";
import { RAKNET_MAGIC, UNCONNECTED_PING_ID, UNCONNECTED_PONG_ID } from "../config/raknet";
import type { RakNetPongData } from "../types";

/**
 * Build a RakNet Unconnected Ping packet (ID {@link UNCONNECTED_PING_ID | 0x01}).
 *
 * Packet layout (33 bytes total):
 * | Offset | Size | Field            |
 * | ------ | ---- | ---------------- |
 * | 0      | 1    | Packet ID (0x01) |
 * | 1      | 8    | Send timestamp   |
 * | 9      | 16   | RakNet magic     |
 * | 25     | 8    | Client GUID      |
 *
 * @returns A {@link Buffer} ready to be sent over UDP.
 */
function buildPingPacket(): Buffer {
  const buf = Buffer.alloc(1 + 8 + 16 + 8);
  let offset = 0;

  buf.writeUInt8(UNCONNECTED_PING_ID, offset);
  offset += 1;

  buf.writeBigInt64BE(BigInt(Date.now()), offset);
  offset += 8;

  RAKNET_MAGIC.copy(buf, offset);
  offset += 16;

  crypto.randomBytes(8).copy(buf, offset);

  return buf;
}

/**
 * Extract the server-info string from a raw Unconnected Pong buffer.
 *
 * Pong layout:
 * | Offset | Size | Field              |
 * | ------ | ---- | ------------------ |
 * | 0      | 1    | Packet ID (0x1c)   |
 * | 1      | 8    | Send timestamp     |
 * | 9      | 8    | Server GUID        |
 * | 17     | 16   | RakNet magic       |
 * | 33     | 2    | String length (N)  |
 * | 35     | N    | Server info string |
 *
 * @param buf - The raw UDP datagram received from the server.
 * @returns The UTF-8 server info string (semicolon-separated fields).
 * @throws {Error} If the buffer is too short or the string is truncated.
 */
function parsePongPayload(buf: Buffer): string {
  const stringLengthOffset = 1 + 8 + 8 + 16;
  if (buf.length < stringLengthOffset + 2) throw new Error("Pong packet too short");

  const strLen = buf.readUInt16BE(stringLengthOffset);
  const strStart = stringLengthOffset + 2;
  if (buf.length < strStart + strLen) throw new Error("Pong string truncated");

  return buf.subarray(strStart, strStart + strLen).toString("utf-8");
}

/**
 * Parse the semicolon-separated server info string returned inside a
 * Bedrock server's unconnected-pong payload.
 *
 * Missing trailing fields are filled with sensible defaults (`"unknown"`,
 * `""`, or `0`) so callers always receive a complete {@link RakNetPongData}
 * object regardless of how many fields the server actually includes.
 *
 * @param raw - The unparsed server info string (e.g. `"MCPE;My Server;685;..."`).
 * @returns A fully populated {@link RakNetPongData} object.
 */
export function parseServerInfo(raw: string): RakNetPongData {
  const parts = raw.split(";");
  return {
    raw,
    edition: parts[0] ?? "unknown",
    motd: parts[1] ?? "unknown",
    protocolVersion: parts[2] ?? "unknown",
    version: parts[3] ?? "unknown",
    onlinePlayers: parseInt(parts[4] ?? "0", 10),
    maxPlayers: parseInt(parts[5] ?? "0", 10),
    serverUniqueId: parts[6] ?? "unknown",
    subMotd: parts[7] ?? "",
    gameMode: parts[8] ?? "unknown",
    gameModeNumeric: parseInt(parts[9] ?? "0", 10),
    portIPv4: parseInt(parts[10] ?? "0", 10),
    portIPv6: parseInt(parts[11] ?? "0", 10),
  };
}

/**
 * Send a RakNet unconnected ping to a Bedrock server and return the
 * parsed pong data.
 *
 * Opens a temporary UDP socket, sends a single
 * {@link buildPingPacket | Unconnected Ping} datagram, and waits for the
 * server's {@link parsePongPayload | Unconnected Pong} response. The socket
 * is always cleaned up -- whether the call succeeds, times out, or errors.
 *
 * @param hostname - Target server hostname or IP address.
 * @param port     - Target server UDP port.
 * @param timeoutMs - Maximum time (ms) to wait for a pong before rejecting.
 * @returns A promise that resolves to the parsed {@link RakNetPongData}.
 * @throws {Error} With message `"Ping timed out"` if no pong arrives in time.
 * @throws {Error} If the UDP socket errors or the pong payload is malformed.
 */
export function pingServer(
  hostname: string,
  port: number,
  timeoutMs: number,
): Promise<RakNetPongData> {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket("udp4");
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.close();
      reject(new Error("Ping timed out"));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      try {
        socket.close();
      } catch {
        // already closed
      }
    };

    socket.on("error", (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    });

    socket.on("message", (msg) => {
      if (settled) return;
      if (msg[0] !== UNCONNECTED_PONG_ID) return;

      settled = true;
      cleanup();

      try {
        const raw = parsePongPayload(msg);
        resolve(parseServerInfo(raw));
      } catch (err) {
        reject(err);
      }
    });

    const packet = buildPingPacket();
    socket.send(packet, 0, packet.length, port, hostname, (err) => {
      if (err && !settled) {
        settled = true;
        cleanup();
        reject(err);
      }
    });
  });
}
