/**
 * Base error class for all application errors.
 * Carries an HTTP {@link statusCode} and a machine-readable {@link code}
 * so the global error handler can build a consistent JSON response.
 */
export class AppError extends Error {
  constructor(
    message: string,
    /** HTTP status code returned to the client. */
    public readonly statusCode: number,
    /** Machine-readable error code (e.g. `"VALIDATION_ERROR"`). */
    public readonly code: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Thrown when a request fails input validation (missing hostname, bad port, etc.).
 *
 * @remarks HTTP 400
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

/**
 * Thrown when the Bedrock server does not respond within the configured timeout.
 *
 * @remarks HTTP 504
 */
export class PingTimeoutError extends AppError {
  constructor(hostname: string, port: number) {
    super(`Ping to ${hostname}:${port} timed out`, 504, "PING_TIMEOUT");
    this.name = "PingTimeoutError";
  }
}

/**
 * Thrown when DNS resolution fails for the requested hostname.
 *
 * @remarks HTTP 422
 */
export class DnsLookupError extends AppError {
  constructor(hostname: string) {
    super(`DNS lookup failed for "${hostname}"`, 422, "DNS_LOOKUP_FAILED");
    this.name = "DnsLookupError";
  }
}

/**
 * Thrown when the RakNet ping exchange fails for a reason other than timeout
 * (e.g. the socket errors out or the pong payload is malformed).
 *
 * @remarks HTTP 502
 */
export class PingError extends AppError {
  constructor(message: string) {
    super(message, 502, "PING_FAILED");
    this.name = "PingError";
  }
}
