const fs = require("fs");
const path = require("path");

const src = path.join("node_modules", "pdfjs-dist", "build", "pdf.worker.min.js");
const destDir = "public";
const dest = path.join(destDir, "pdf.worker.min.js");

if (fs.existsSync(src)) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("Copied PDF worker to public/");
}
