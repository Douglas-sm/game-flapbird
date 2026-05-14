const serverHandler = require("../server");

function getPathFromQuery(queryPath) {
  if (Array.isArray(queryPath)) {
    return queryPath.filter(Boolean).join("/");
  }

  return queryPath || "";
}

function vercelHandler(req, res) {
  if (req.query && Object.prototype.hasOwnProperty.call(req.query, "path")) {
    const url = new URL(req.url, "http://localhost");
    const pathname = getPathFromQuery(req.query.path);

    url.searchParams.delete("path");
    req.url = `/${pathname}${url.search || ""}`;
  } else if (req.url === "/api") {
    req.url = "/";
  }

  return serverHandler(req, res);
}

module.exports = vercelHandler;
