#!/usr/bin/env node
// Copy public/ and .next/static/ into .next/standalone/ so the minimal
// standalone server can serve them. Next.js 16 does NOT copy these folders
// automatically (by design — they're meant for a CDN), but on Railway we
// serve everything from the standalone Node server, so we copy them here.
//
// Ref: node_modules/next/dist/docs/01-app/03-api-reference/05-config/
//      01-next-config-js/output.md (lines 36-42)
//
// Cross-platform: uses fs.promises.cp (Node >= 16.7, stable in Node 22).
// Forward slashes throughout so it works on Windows dev AND Linux (Railway).

import { cp, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");

const publicDir = path.join(appRoot, "public");
const nextStaticDir = path.join(appRoot, ".next", "static");
const standaloneRoot = path.join(appRoot, ".next", "standalone");
const standalonePublic = path.join(standaloneRoot, "public");
const standaloneNextStatic = path.join(standaloneRoot, ".next", "static");

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(standaloneRoot))) {
    console.error(
      `[copy-standalone-assets] ERROR: ${standaloneRoot} does not exist. ` +
        `Did 'next build' run with output:"standalone" in next.config.ts?`,
    );
    process.exit(1);
  }

  // 1. Copy public/ -> .next/standalone/public/
  if (await exists(publicDir)) {
    await cp(publicDir, standalonePublic, { recursive: true, force: true });
    console.log(`[copy-standalone-assets] copied public/ -> .next/standalone/public/`);
  } else {
    console.warn(`[copy-standalone-assets] WARN: ${publicDir} not found, skipping`);
  }

  // 2. Copy .next/static/ -> .next/standalone/.next/static/
  if (await exists(nextStaticDir)) {
    await cp(nextStaticDir, standaloneNextStatic, { recursive: true, force: true });
    console.log(
      `[copy-standalone-assets] copied .next/static/ -> .next/standalone/.next/static/`,
    );
  } else {
    console.warn(`[copy-standalone-assets] WARN: ${nextStaticDir} not found, skipping`);
  }

  console.log(`[copy-standalone-assets] done`);
}

main().catch((err) => {
  console.error(`[copy-standalone-assets] FAILED:`, err);
  process.exit(1);
});
