/**
 * Structured representation of the data returned inside a Bedrock
 * server's unconnected-pong payload.
 *
 * Field order matches the semicolon-separated string the server sends:
 *
 * ```
 * Edition;MOTD;ProtocolVersion;VersionName;OnlinePlayers;MaxPlayers;
 * ServerUniqueId;SubMOTD;GameMode;GameModeNumeric;PortIPv4;PortIPv6
 * ```
 *
 * @see {@link https://wiki.vg/Raknet_Protocol#Unconnected_Pong | wiki.vg RakNet Protocol}
 */
export interface RakNetPongData {
  /** The full, unparsed semicolon-separated server info string. */
  raw: string;
  /** Server edition identifier (e.g. `"MCPE"` for Bedrock). */
  edition: string;
  /** Primary message-of-the-day / server name. */
  motd: string;
  /** Numeric protocol version the server speaks (e.g. `"685"`). */
  protocolVersion: string;
  /** Human-readable game version (e.g. `"26.0.1"`). */
  version: string;
  /** Number of players currently online. */
  onlinePlayers: number;
  /** Maximum player slots configured on the server. */
  maxPlayers: number;
  /** Server-unique identifier string. */
  serverUniqueId: string;
  /** Secondary MOTD line (often the world or sub-server name). */
  subMotd: string;
  /** Default game mode name (e.g. `"Survival"`, `"Creative"`). */
  gameMode: string;
  /** Numeric game mode identifier (0 = Survival, 1 = Creative, etc.). */
  gameModeNumeric: number;
  /** IPv4 port the server is listening on. */
  portIPv4: number;
  /** IPv6 port the server is listening on. */
  portIPv6: number;
}

/**
 * Public-facing response shape returned by the ping service.
 *
 * This is a curated subset of the raw {@link RakNetPongData} combined with
 * request metadata (`hostname`, `port`) and a response `timestamp`.
 */
export interface PingResult {
  /** The hostname that was queried. */
  hostname: string;
  /** The UDP port that was queried. */
  port: number;
  /** Human-readable game version (e.g. `"26.0.1"`). */
  version: string;
  /** Numeric protocol version the server speaks (e.g. `"685"`). */
  protocolVersion: string;
  /** Number of players currently online. */
  onlinePlayers: number;
  /** Maximum player slots configured on the server. */
  maxPlayers: number;
  /** Primary message-of-the-day / server name. */
  motd: string;
  /** Secondary MOTD line (often the world or sub-server name). */
  subMotd: string;
  /** Default game mode name (e.g. `"Survival"`, `"Creative"`). */
  gameMode: string;
  /** Server-unique identifier string. */
  serverUniqueId: string;
  /** Server edition identifier (e.g. `"MCPE"` for Bedrock). */
  edition: string;
  /** ISO-8601 timestamp of when the response was generated. */
  timestamp: string;
}

/** Shape of the expected query-string parameters on `GET /ping`. */
export interface PingQuery {
  hostname?: string;
  port?: string;
}
