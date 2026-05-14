const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "dist");

const ENTRIES = ["index.html", "style.css", "js", "assets"];

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

for (const entry of ENTRIES) {
  const source = path.join(ROOT, entry);

  if (!fs.existsSync(source)) {
    continue;
  }

  const destination = path.join(OUT_DIR, entry);
  fs.cpSync(source, destination, { recursive: true });
}

console.log(`Static build generated at ${path.relative(ROOT, OUT_DIR)}`);
