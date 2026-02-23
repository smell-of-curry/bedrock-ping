export const config = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  host: process.env.HOST ?? "0.0.0.0",

  /** Default Bedrock server port when none is supplied by the caller. */
  defaultBedrockPort: 19132,

  /** UDP ping timeout in milliseconds. */
  pingTimeoutMs: parseInt(process.env.PING_TIMEOUT_MS ?? "5000", 10),

  /** Rate-limit: max requests per window. */
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? "120", 10),

  /** Rate-limit: window duration in milliseconds. */
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "300000", 10),
} as const;
