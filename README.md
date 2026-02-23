# Bedrock Ping API

[![CI](https://github.com/smell-of-curry/bedrock-ping/actions/workflows/ci.yml/badge.svg)](https://github.com/smell-of-curry/bedrock-ping/actions/workflows/ci.yml)

A fast, typed API for pinging Minecraft Bedrock Edition servers. Built with TypeScript, Fastify, and a lightweight RakNet implementation -- no heavy dependencies.

## Features

- **Zero-dependency ping**: Custom UDP RakNet unconnected-ping implementation -- no third-party RakNet libraries needed.
- **Typed end-to-end**: Full TypeScript with strict mode, validated inputs, and typed responses.
- **Production-ready**: Rate limiting, CORS, structured error responses, health endpoint.
- **Comprehensive tests**: Unit, integration, and E2E test suites with coverage enforcement.
- **CI/CD**: GitHub Actions pipeline with lint, typecheck, test, build, and coverage gates.
- **Vercel-ready**: Configured for serverless deployment out of the box.

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Install & Run

```bash
git clone https://github.com/smell-of-curry/bedrock-ping.git
cd bedrock-ping
npm install
npm run dev
```

The API will be available at `http://localhost:3000`.

## API Endpoints

### `GET /ping`

Ping a Minecraft Bedrock server.

| Parameter  | Type   | Required | Default | Description                |
| ---------- | ------ | -------- | ------- | -------------------------- |
| `hostname` | string | Yes      | --      | Server hostname or IP      |
| `port`     | number | No       | 19132   | Server port (1 -- 65535)   |

**Success Response (200)**

```json
{
  "hostname": "play.pokebedrock.com",
  "port": 19132,
  "version": "26.0.1",
  "protocolVersion": "685",
  "onlinePlayers": 4521,
  "maxPlayers": 20000,
  "motd": "PokeBedrock",
  "subMotd": "A Bedrock Server",
  "gameMode": "Survival",
  "serverUniqueId": "12345678901234567",
  "edition": "MCPE",
  "timestamp": "2026-02-23T12:00:00.000Z"
}
```

**Error Responses**

| Status | Code               | When                                        |
| ------ | ------------------ | ------------------------------------------- |
| 400    | VALIDATION_ERROR   | Missing/invalid `hostname` or `port`        |
| 422    | DNS_LOOKUP_FAILED  | Hostname cannot be resolved                 |
| 502    | PING_FAILED        | Server unreachable or returned invalid data |
| 504    | PING_TIMEOUT       | Server did not respond within timeout       |

### `GET /health`

Health check endpoint.

```json
{ "status": "ok", "timestamp": "2026-02-23T12:00:00.000Z" }
```

### `GET /`

API metadata with endpoint documentation.

## Scripts

| Command               | Description                               |
| --------------------- | ----------------------------------------- |
| `npm run dev`         | Start development server with hot reload  |
| `npm run build`       | Compile TypeScript to `dist/`             |
| `npm start`           | Run compiled production server            |
| `npm run lint`        | Run ESLint                                |
| `npm run lint:fix`    | Run ESLint with auto-fix                  |
| `npm run format`      | Format code with Prettier                 |
| `npm run format:check`| Check formatting without writing          |
| `npm run typecheck`   | Run TypeScript type checking              |
| `npm test`            | Run all tests                             |
| `npm run test:unit`   | Run unit tests only                       |
| `npm run test:integration` | Run integration tests only           |
| `npm run test:e2e`    | Run end-to-end tests only                 |
| `npm run test:watch`  | Run tests in watch mode                   |
| `npm run test:coverage`| Run tests with coverage report           |

## Testing

This project uses a three-layer test pyramid, all run via [Vitest](https://vitest.dev/):

1. **Unit tests** (`test/unit/`) — fast, isolated tests for pure functions like response parsing and validation.
2. **Integration tests** (`test/integration/`) — route-level tests using Fastify's `inject()` through the full middleware stack.
3. **End-to-end tests** (`test/e2e/`) — full API contract tests that boot the real application.

### Live Network Tests

The E2E suite includes an optional test that pings a real public Bedrock server. It is **skipped by default** to avoid flaky CI runs (UDP traffic may be blocked in some environments).

```bash
RUN_LIVE_TESTS=true npm run test:e2e
```

### Coverage

Coverage thresholds are enforced in `vitest.config.ts`:

| Metric     | Threshold |
| ---------- | --------- |
| Lines      | 80%       |
| Branches   | 75%       |
| Functions  | 80%       |
| Statements | 80%       |

`src/server.ts` is excluded from coverage since it only calls `buildApp()` and `listen()`.

### Writing New Tests

- Place unit tests in `test/unit/<module>.test.ts`.
- Place route tests in `test/integration/`.
- Place contract/smoke tests in `test/e2e/`.
- Use Fastify's `app.inject()` for HTTP testing — no need for a running server port.
- Guard any test that requires real network access behind `process.env.RUN_LIVE_TESTS`.

### Troubleshooting

- **Tests hang or time out** — The default timeout is 15 s (set in `vitest.config.ts`). Increase `testTimeout` locally if a real-network test is slow.
- **UDP tests fail in CI** — Some CI environments block outbound UDP. Live-network tests are gated behind `RUN_LIVE_TESTS` for this reason; all other tests use Fastify inject and never open real sockets.


## Environment Variables

| Variable              | Default  | Description                          |
| --------------------- | -------- | ------------------------------------ |
| `PORT`                | `3000`   | Server port                          |
| `HOST`                | `0.0.0.0`| Server bind address                 |
| `PING_TIMEOUT_MS`     | `5000`   | UDP ping timeout in milliseconds     |
| `RATE_LIMIT_MAX`      | `120`    | Max requests per rate-limit window   |
| `RATE_LIMIT_WINDOW_MS`| `300000` | Rate-limit window duration (ms)      |
| `RUN_LIVE_TESTS`      | --       | Set to `true` to enable live E2E tests |

## Deployment

### Vercel

Vercel can deploy Fastify apps with zero configuration (it detects `src/server.ts` as the entrypoint):

1. Connect your Git repo in the Vercel dashboard.
2. Deploy.

For local verification, you can run `vercel dev` (Vercel CLI).

### Other Platforms

The compiled output in `dist/` is a standard Node.js application. Deploy it anywhere Node.js 20+ is available:

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Make your changes -- ensure `npm run lint`, `npm run typecheck`, and `npm test` all pass.
4. Commit and push.
5. Open a pull request.

### PR Checklist

- [ ] Code follows the early-return style (guard clauses over nested blocks)
- [ ] New/changed endpoints have corresponding tests
- [ ] Linting and type checking pass
- [ ] All tests pass
- [ ] README is updated if behavior changed

## License

MIT
