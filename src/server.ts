import { buildApp } from "./app";
import { config } from "./config/env";

(async () => {
  const app = await buildApp();

  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
})();