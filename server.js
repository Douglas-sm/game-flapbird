const http = require("http");
const fs = require("fs");
const path = require("path");

const HOST = "0.0.0.0";
const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_ROOT = path.resolve(process.cwd());

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const PUBLIC_FILES = new Set(["index.html", "style.css"]);
const PUBLIC_DIRECTORIES = ["assets", "js"];

function sendError(res, code, message, headers = {}) {
  res.writeHead(code, {
    "Content-Type": "text/plain; charset=utf-8",
    ...headers,
  });
  res.end(message);
}

function safePath(root, urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, "");
  return path.resolve(root, normalized);
}

function isPublicPath(root, filePath) {
  const relativePath = path.relative(root, filePath);

  if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return false;
  }

  return (
    PUBLIC_FILES.has(relativePath) ||
    PUBLIC_DIRECTORIES.some((directory) => relativePath.startsWith(`${directory}${path.sep}`))
  );
}

function createStaticHandler({ root = DEFAULT_ROOT } = {}) {
  const staticRoot = path.resolve(root);

  return function staticHandler(req, res) {
    if (!["GET", "HEAD"].includes(req.method)) {
      sendError(res, 405, "Method Not Allowed", { Allow: "GET, HEAD" });
      return;
    }

    const pathname = req.url.split("?")[0] || "/";
    const requestPath = pathname === "/" ? "/index.html" : pathname;
    let filePath;

    try {
      filePath = safePath(staticRoot, requestPath);
    } catch {
      sendError(res, 400, "Bad Request");
      return;
    }

    if (!filePath.startsWith(`${staticRoot}${path.sep}`) && filePath !== staticRoot) {
      sendError(res, 403, "Forbidden");
      return;
    }

    if (!isPublicPath(staticRoot, filePath)) {
      sendError(res, 404, "Not Found");
      return;
    }

    fs.stat(filePath, (statErr, stat) => {
      if (statErr || !stat.isFile()) {
        sendError(res, 404, "Not Found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeType = MIME_TYPES[ext] || "application/octet-stream";

      res.writeHead(200, {
        "Content-Type": mimeType,
        "Cache-Control": "no-store",
      });

      if (req.method === "HEAD") {
        res.end();
        return;
      }

      const stream = fs.createReadStream(filePath);
      stream.on("error", () => {
        if (!res.headersSent) {
          sendError(res, 500, "Internal Server Error");
          return;
        }

        res.destroy();
      });
      stream.pipe(res);
    });
  };
}

const serverHandler = createStaticHandler();

if (require.main === module) {
  const server = http.createServer(serverHandler);

  server.listen(PORT, HOST, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = serverHandler;
module.exports.createStaticHandler = createStaticHandler;
