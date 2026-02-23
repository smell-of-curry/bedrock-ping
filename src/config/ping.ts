/**
 * Validation constraints for the `/ping` route query parameters.
 *
 * @see {@link https://en.wikipedia.org/wiki/Hostname#Syntax | Hostname syntax}
 */

/** Characters allowed in a hostname: alphanumeric, dots, hyphens, underscores. */
export const HOSTNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

/** Lowest valid port number (inclusive). */
export const MIN_PORT = 1;

/** Highest valid port number (inclusive). */
export const MAX_PORT = 65535;
