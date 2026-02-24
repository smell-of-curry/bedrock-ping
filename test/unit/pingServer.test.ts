import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "node:events";
import { RAKNET_MAGIC, UNCONNECTED_PONG_ID, UNCONNECTED_PING_ID } from "../../src/config/raknet";

type MockSocket = EventEmitter & {
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
};

let latestSocket: MockSocket;
let nextSendError: Error | null = null;

vi.mock("node:dgram", () => ({
  default: {
    createSocket: vi.fn(() => {
      const socket: MockSocket = Object.assign(new EventEmitter(), {
        send: vi.fn(
          (
            _buf: Buffer,
            _offset: number,
            _length: number,
            _port: number,
            _host: string,
            cb?: (err: Error | null) => void,
          ) => {
            if (cb) cb(nextSendError);
          },
        ),
        close: vi.fn(),
      });
      latestSocket = socket;
      return socket;
    }),
  },
}));

import { pingServer } from "../../src/lib/raknetClient";

function buildPongBuffer(serverInfo: string): Buffer {
  const strBuf = Buffer.from(serverInfo, "utf-8");
  const buf = Buffer.alloc(1 + 8 + 8 + 16 + 2 + strBuf.length);
  let offset = 0;

  buf.writeUInt8(UNCONNECTED_PONG_ID, offset);
  offset += 1;

  buf.writeBigInt64BE(BigInt(Date.now()), offset);
  offset += 8 + 8;

  RAKNET_MAGIC.copy(buf, offset);
  offset += 16;

  buf.writeUInt16BE(strBuf.length, offset);
  offset += 2;

  strBuf.copy(buf, offset);
  return buf;
}

describe("pingServer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    nextSendError = null;
  });

  it("resolves with parsed pong data on valid response", async () => {
    const serverInfo =
      "MCPE;Test Server;685;26.0.1;5;20;12345;SubMOTD;Survival;1;19132;19133";

    const promise = pingServer("localhost", 19132, 5000);

    const pong = buildPongBuffer(serverInfo);
    latestSocket.emit("message", pong);

    const result = await promise;
    expect(result.edition).toBe("MCPE");
    expect(result.motd).toBe("Test Server");
    expect(result.version).toBe("26.0.1");
    expect(result.onlinePlayers).toBe(5);
    expect(result.maxPlayers).toBe(20);
  });

  it("sends a valid ping packet", async () => {
    const promise = pingServer("example.com", 19132, 5000);

    latestSocket.emit("message", buildPongBuffer("MCPE;X;1;1;0;0"));
    await promise;

    expect(latestSocket.send).toHaveBeenCalledOnce();
    const [buf, offset, length, port, host] = latestSocket.send.mock.calls[0];
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBe(33);
    expect(buf.readUInt8(0)).toBe(UNCONNECTED_PING_ID);
    expect(offset).toBe(0);
    expect(length).toBe(33);
    expect(port).toBe(19132);
    expect(host).toBe("example.com");
  });

  it("rejects with timeout when no pong arrives", async () => {
    const promise = pingServer("localhost", 19132, 1000);

    vi.advanceTimersByTime(1000);

    await expect(promise).rejects.toThrow("Ping timed out");
    expect(latestSocket.close).toHaveBeenCalled();
  });

  it("rejects when socket emits an error", async () => {
    const promise = pingServer("localhost", 19132, 5000);

    latestSocket.emit("error", new Error("Socket failure"));

    await expect(promise).rejects.toThrow("Socket failure");
    expect(latestSocket.close).toHaveBeenCalled();
  });

  it("rejects when send callback returns an error", async () => {
    nextSendError = new Error("Send failed");
    const promise = pingServer("localhost", 19132, 5000);
    await expect(promise).rejects.toThrow("Send failed");
  });

  it("ignores packets that are not pong (wrong ID)", async () => {
    const promise = pingServer("localhost", 19132, 1000);

    const nonPong = Buffer.alloc(50);
    nonPong.writeUInt8(0x05, 0);
    latestSocket.emit("message", nonPong);

    vi.advanceTimersByTime(1000);

    await expect(promise).rejects.toThrow("Ping timed out");
  });

  it("rejects when pong payload is too short", async () => {
    const promise = pingServer("localhost", 19132, 5000);

    const shortBuf = Buffer.alloc(10);
    shortBuf.writeUInt8(UNCONNECTED_PONG_ID, 0);
    latestSocket.emit("message", shortBuf);

    await expect(promise).rejects.toThrow("Pong packet too short");
  });

  it("rejects when pong string is truncated", async () => {
    const promise = pingServer("localhost", 19132, 5000);

    const buf = Buffer.alloc(1 + 8 + 8 + 16 + 2);
    buf.writeUInt8(UNCONNECTED_PONG_ID, 0);
    buf.writeUInt16BE(9999, 1 + 8 + 8 + 16);
    latestSocket.emit("message", buf);

    await expect(promise).rejects.toThrow("Pong string truncated");
  });

  it("ignores late events after settlement", async () => {
    const promise = pingServer("localhost", 19132, 5000);

    latestSocket.emit("message", buildPongBuffer("MCPE;X;1;1;0;0"));
    await promise;

    latestSocket.emit("error", new Error("late error"));
    latestSocket.emit("message", buildPongBuffer("MCPE;Y;1;1;0;0"));
  });
});
