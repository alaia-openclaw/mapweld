#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const workspaceRoot = path.resolve(__dirname, "..");
const databaseRoot = path.join(
  workspaceRoot,
  "3CQC ref",
  "Pipedata-Pro 15.0",
  "Database"
);
const outputPath = path.join(workspaceRoot, "docs", "pipedata-architecture.csv");

function isDirectory(fullPath) {
  try {
    return fs.statSync(fullPath).isDirectory();
  } catch {
    return false;
  }
}

function readLines(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return raw
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function parseSetSummary(folderPath, folderName) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  const setFiles = entries
    .filter((entry) => entry.isFile() && /\.set$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  const rootSetName = setFiles.find((name) => name.toLowerCase() === `${folderName.toLowerCase()}.set`);
  const rootSetLines = rootSetName ? readLines(path.join(folderPath, rootSetName)) : [];
  const rootSelection = rootSetLines[0] || "";

  const levelSetFiles = setFiles.filter(
    (name) =>
      name.toLowerCase() !== `${folderName.toLowerCase()}.set` &&
      name.toLowerCase() !== "activetab.set"
  );

  const nodes = [];
  for (const setName of levelSetFiles) {
    const lines = readLines(path.join(folderPath, setName));
    const nodeId = lines[0] || path.basename(setName, ".set");
    nodes.push({
      setFile: setName,
      nodeId,
      lineCount: lines.length,
      payloadPreview: lines.slice(1, 6).join(" | "),
    });
  }

  return {
    rootSetName: rootSetName || "",
    rootSelection,
    nodeCount: nodes.length,
    nodes,
  };
}

function collectFilePrefixes(folderPath, folderName) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true }).filter((e) => e.isFile());
  const prefixes = new Set();
  for (const entry of entries) {
    const base = path.basename(entry.name, path.extname(entry.name));
    if (!base) continue;
    const match = base.match(/^([A-Za-z#]+)/);
    if (!match) continue;
    prefixes.add(match[1]);
  }
  if (prefixes.size === 0) prefixes.add(folderName);
  return Array.from(prefixes).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function buildRows() {
  if (!isDirectory(databaseRoot)) {
    throw new Error(`Database folder not found: ${databaseRoot}`);
  }
  const folders = fs
    .readdirSync(databaseRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const rows = [];
  for (const folderName of folders) {
    const folderPath = path.join(databaseRoot, folderName);
    const setSummary = parseSetSummary(folderPath, folderName);
    const prefixes = collectFilePrefixes(folderPath, folderName).join(" | ");

    if (setSummary.nodes.length === 0) {
      rows.push({
        folderCode: folderName,
        rootSet: setSummary.rootSetName,
        rootSelection: setSummary.rootSelection,
        setFile: "",
        nodeId: "",
        nodeType: "folder_only",
        lineCount: "",
        payloadPreview: "",
        detectedPrefixes: prefixes,
        mappedCategory: "",
        mappedSubcategory: "",
        mappedSubmenu: "",
        chosenPrefix: "",
        notes: "",
      });
      continue;
    }

    for (const node of setSummary.nodes) {
      rows.push({
        folderCode: folderName,
        rootSet: setSummary.rootSetName,
        rootSelection: setSummary.rootSelection,
        setFile: node.setFile,
        nodeId: node.nodeId,
        nodeType: "set_node",
        lineCount: node.lineCount,
        payloadPreview: node.payloadPreview,
        detectedPrefixes: prefixes,
        mappedCategory: "",
        mappedSubcategory: "",
        mappedSubmenu: "",
        chosenPrefix: "",
        notes: "",
      });
    }
  }
  return rows;
}

function writeCsv(rows) {
  const headers = [
    "folderCode",
    "rootSet",
    "rootSelection",
    "setFile",
    "nodeId",
    "nodeType",
    "lineCount",
    "payloadPreview",
    "detectedPrefixes",
    "mappedCategory",
    "mappedSubcategory",
    "mappedSubmenu",
    "chosenPrefix",
    "notes",
  ];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((key) => csvEscape(row[key])).join(","));
  }
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
}

function main() {
  const rows = buildRows();
  writeCsv(rows);
  console.log(`Wrote ${rows.length} rows to ${outputPath}`);
}

main();
