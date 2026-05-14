const path = require("path");
const { createStaticHandler } = require("../server");

const distHandler = createStaticHandler({
  root: path.join(process.cwd(), "dist"),
});

function getPathFromQuery(queryPath) {
  if (Array.isArray(queryPath)) {
    return queryPath.filter(Boolean).join("/");
  }

  return queryPath || "";
}

function vercelHandler(req, res) {
  const url = new URL(req.url, "http://localhost");

  if (req.query && Object.prototype.hasOwnProperty.call(req.query, "path")) {
    const pathname = getPathFromQuery(req.query.path);

    url.searchParams.delete("path");

    req.url = pathname ? `/${pathname}${url.search || ""}` : "/";
  }

  return distHandler(req, res);
}

module.exports = vercelHandler;
