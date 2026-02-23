import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, cpSync } from "node:fs";

const FUNC_DIR = ".vercel/output/functions/api.func";

mkdirSync(FUNC_DIR, { recursive: true });
mkdirSync(".vercel/output/static", { recursive: true });

execSync("npx tsup --entry.index src/vercel.ts --format cjs --out-dir " + FUNC_DIR, {
  stdio: "inherit",
});

cpSync("node_modules", `${FUNC_DIR}/node_modules`, { recursive: true });

writeFileSync(`${FUNC_DIR}/package.json`, JSON.stringify({ type: "commonjs" }));

writeFileSync(
  `${FUNC_DIR}/.vc-config.json`,
  JSON.stringify({ runtime: "nodejs20.x", handler: "index.cjs", launcherType: "Nodejs" }),
);

writeFileSync(
  ".vercel/output/config.json",
  JSON.stringify({
    version: 3,
    routes: [{ src: "/(.*)", dest: "/api" }],
  }),
);
