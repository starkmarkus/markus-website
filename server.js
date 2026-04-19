import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { processContactSubmission } from "./lib/contact.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".webp": "image/webp",
};

const criticalAssetPaths = new Set([
  "/index.html",
  "/src/styles.css",
  "/src/main.js",
  "/assets/logos/desktop-mark.svg",
  "/assets/logos/window-badge.svg",
  "/assets/icns/portfolio-folder.svg",
  "/assets/icns/trash-bin.svg",
  "/assets/ui/mountains-hero-768.webp",
  "/assets/ui/mountains-hero-1280.webp",
  "/assets/ui/mountains-hero-1600.webp",
  "/assets/ui/mountains-hero-1920.webp",
]);

const assetCache = new Map();

const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (pathname === "/api/contact") {
    await handleContactRequest(request, response);
    return;
  }

  const url = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(url).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(__dirname, safePath);

  try {
    const extension = path.extname(filePath);
    const asset = await getAssetRecord(url, filePath, extension);

    if (request.headers["if-none-match"] === asset.etag) {
      response.writeHead(304, buildResponseHeaders(asset));
      response.end();
      return;
    }

    if (request.headers["if-modified-since"]) {
      const ifModifiedSince = Date.parse(request.headers["if-modified-since"]);
      if (Number.isFinite(ifModifiedSince) && ifModifiedSince >= asset.mtimeMs) {
        response.writeHead(304, buildResponseHeaders(asset));
        response.end();
        return;
      }
    }

    response.writeHead(200, buildResponseHeaders(asset));
    if (request.method === "HEAD") {
      response.end();
      return;
    }

    response.end(asset.body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

async function getAssetRecord(urlPath, filePath, extension) {
  const fileStats = await stat(filePath);
  const cached = assetCache.get(urlPath);

  if (cached && cached.mtimeMs === fileStats.mtimeMs) {
    return cached;
  }

  const body = await readFile(filePath);
  const asset = {
    body,
    mtimeMs: fileStats.mtimeMs,
    etag: createEtag(body, fileStats),
    lastModified: new Date(fileStats.mtimeMs).toUTCString(),
    cacheControl: getCacheControl(urlPath, extension),
    contentType: mimeTypes[extension] || "application/octet-stream",
    contentLength: body.byteLength,
  };

  if (criticalAssetPaths.has(urlPath)) {
    assetCache.set(urlPath, asset);
  } else {
    assetCache.delete(urlPath);
  }

  return asset;
}

function buildResponseHeaders(asset) {
  return {
    "Content-Type": asset.contentType,
    "Content-Length": asset.contentLength,
    "Cache-Control": asset.cacheControl,
    ETag: asset.etag,
    "Last-Modified": asset.lastModified,
  };
}

function createEtag(body, fileStats) {
  const hash = createHash("sha1").update(body).digest("hex").slice(0, 12);
  return `W/"${fileStats.size.toString(16)}-${Math.floor(fileStats.mtimeMs).toString(16)}-${hash}"`;
}

function getCacheControl(urlPath, extension) {
  if (urlPath === "/index.html") {
    return "public, max-age=0, must-revalidate";
  }

  if (extension === ".js" || extension === ".css") {
    return "public, max-age=300, stale-while-revalidate=86400";
  }

  if ([".svg", ".webp", ".png", ".jpg", ".jpeg", ".avif", ".wasm"].includes(extension)) {
    return "public, max-age=604800, stale-while-revalidate=2592000";
  }

  return "public, max-age=300";
}

async function handleContactRequest(request, response) {
  if (request.method === "OPTIONS") {
    response.writeHead(204, { Allow: "POST, OPTIONS" });
    response.end();
    return;
  }

  if (request.method !== "POST") {
    writeJson(response, 405, { ok: false, error: "Method not allowed." }, { Allow: "POST, OPTIONS" });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    writeJson(response, error.status || 400, { ok: false, error: error.message || "Invalid request body." });
    return;
  }

  const result = await processContactSubmission(payload);
  writeJson(response, result.status, result.body);
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32_768) {
      const error = new Error("Request body is too large.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    const error = new Error("Invalid request body.");
    error.status = 400;
    throw error;
  }
}

function writeJson(response, status, body, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
  response.end(JSON.stringify(body));
}

server.listen(port, "0.0.0.0", () => {
  console.log(`Markus Stark desktop running at http://localhost:${port}`);
});
