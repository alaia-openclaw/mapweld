/**
 * Walk 3CQC ref/Pipedata-Pro 15.0/Database and write data/pipedata-database-inventory.md
 * for cross-checking Pipedata on-disk layout vs the UI tree (pipedata-catalog-tree.md).
 *
 * Run from project root: npm run inventory:pipedata-database
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const databaseRoot = path.join(
  projectRoot,
  "3CQC ref",
  "Pipedata-Pro 15.0",
  "Database"
);
const outPath = path.join(projectRoot, "data", "pipedata-database-inventory.md");

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Immediate children only */
function readImmediate(dir) {
  if (!fs.existsSync(dir)) return { files: [], dirs: [] };
  const list = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  const dirs = [];
  for (const d of list) {
    if (d.isDirectory()) dirs.push(d.name);
    else files.push(d.name);
  }
  dirs.sort((a, b) => a.localeCompare(b));
  files.sort((a, b) => a.localeCompare(b));
  return { files, dirs };
}

/** Recursive file count, total bytes, extension histogram */
function recursiveInventory(dir) {
  let fileCount = 0;
  let totalBytes = 0;
  const extCounts = new Map();

  function walk(p) {
    let entries;
    try {
      entries = fs.readdirSync(p, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(p, e.name);
      if (e.isDirectory()) walk(full);
      else {
        fileCount += 1;
        try {
          totalBytes += fs.statSync(full).size;
        } catch {
          /* ignore */
        }
        const ext = path.extname(e.name).toLowerCase() || "(no ext)";
        extCounts.set(ext, (extCounts.get(ext) ?? 0) + 1);
      }
    }
  }

  walk(dir);
  const topExts = [...extCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  return { fileCount, totalBytes, topExts };
}

function escapeCell(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

function main() {
  const now = new Date().toISOString();

  if (!fs.existsSync(databaseRoot) || !fs.statSync(databaseRoot).isDirectory()) {
    const msg = [
      "# Pipedata Database inventory",
      "",
      `Generated: ${now}`,
      "",
      `**Path:** \`${databaseRoot}\``,
      "",
      "**Status:** Folder not found. Clone or copy Pipedata Pro under \`3CQC ref/Pipedata-Pro 15.0/\` so the \`Database\` directory exists.",
      "",
    ].join("\n");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, msg, "utf8");
    console.warn(`Database not found at ${databaseRoot}`);
    console.log(`Wrote stub to ${outPath}`);
    return;
  }

  const { files: rootFiles, dirs: topDirs } = readImmediate(databaseRoot);

  const lines = [
    "# Pipedata Database inventory",
    "",
    `Generated: ${now}`,
    "",
    `**Root:** \`${databaseRoot}\``,
    "",
    "Top-level folders mirror major data domains (compare with [`pipedata-catalog-tree.md`](pipedata-catalog-tree.md)). This file is **generated**; do not edit by hand.",
    "",
    "## Root-level files",
    "",
  ];

  if (rootFiles.length === 0) {
    lines.push("_(none)_", "");
  } else {
    lines.push("| File |", "|------|");
    for (const f of rootFiles) {
      lines.push(`| ${escapeCell(f)} |`);
    }
    lines.push("");
  }

  lines.push("## Summary (top-level folders)", "", "| Folder | Direct subdirs | Direct files | Files (recursive) | Size |", "|--------|----------------:|---------------:|------------------:|------|");

  const details = [];

  for (const name of topDirs) {
    const full = path.join(databaseRoot, name);
    const { files: df, dirs: dd } = readImmediate(full);
    const rec = recursiveInventory(full);
    lines.push(
      `| ${escapeCell(name)} | ${dd.length} | ${df.length} | ${rec.fileCount} | ${formatBytes(rec.totalBytes)} |`
    );

    const extLine = rec.topExts.map(([ext, n]) => `${ext}: ${n}`).join(", ");
    const childDirsPreview = dd.length
      ? dd.slice(0, 40).join(", ") + (dd.length > 40 ? ", …" : "")
      : "—";
    details.push({
      name,
      directFiles: df.length,
      directDirs: dd.length,
      childDirsPreview,
      extLine,
    });
  }

  lines.push("", "## Per-folder detail", "");

  for (const d of details) {
    lines.push(
      `### \`${d.name}\``,
      "",
      `- **Immediate subdirectories:** ${d.directDirs} (${d.childDirsPreview})`,
      `- **File types (recursive, top):** ${d.extLine || "—"}`,
      ""
    );
  }

  const body = lines.join("\n");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, body, "utf8");

  console.log(`Wrote ${outPath}`);
  console.log(`Top-level folders: ${topDirs.length}, root files: ${rootFiles.length}`);
}

main();
