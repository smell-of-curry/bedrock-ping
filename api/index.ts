import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../src/app";

const app = await buildApp();
await app.ready();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  app.server.emit("request", req, res);
}
