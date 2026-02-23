/**
 * RakNet "offline message" magic bytes (`00ffff00 fefefefe fdfdfdfd 12345678`).
 *
 * Every unconnected ping/pong packet must include this 16-byte constant so the
 * receiver can distinguish RakNet traffic from other UDP datagram's. The value is
 * hard-coded in the protocol and has never changed across RakNet versions.
 *
 * @see {@link https://wiki.vg/Raknet_Protocol#Unconnected_Ping | wiki.vg RakNet Protocol}
 */
export const RAKNET_MAGIC = Buffer.from("00ffff00fefefefefdfdfdfd12345678", "hex");

/** Packet ID for an unconnected ping ({@link https://wiki.vg/Raknet_Protocol#Unconnected_Ping | 0x01}). */
export const UNCONNECTED_PING_ID = 0x01;

/** Packet ID for an unconnected pong ({@link https://wiki.vg/Raknet_Protocol#Unconnected_Pong | 0x1c}). */
export const UNCONNECTED_PONG_ID = 0x1c;
