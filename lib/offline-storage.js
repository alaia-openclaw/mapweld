import { openDB } from "idb";

const DB_NAME = "weld-dashboard";
const DB_VERSION = 1;
const STORE_NAME = "projects";

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
        }
      },
    });
  }
  return dbPromise;
}

export async function saveProject(id, data) {
  const db = await getDB();
  const firstDrawingFilename = Array.isArray(data?.drawings) ? data.drawings[0]?.filename : "";
  const preferredName =
    data?.projectMeta?.projectName?.trim()
    || firstDrawingFilename
    || data?.pdfFilename
    || "Untitled";
  const record = {
    id,
    name: String(preferredName).replace(/\.pdf$/i, ""),
    updatedAt: Date.now(),
    data,
  };
  await db.put(STORE_NAME, record);
  return id;
}

export async function loadProject(id) {
  const db = await getDB();
  const record = await db.get(STORE_NAME, id);
  if (!record) return null;
  return { id: record.id, ...record.data };
}

export async function listProjects() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all
    .map((r) => ({ id: r.id, name: r.name, updatedAt: r.updatedAt }))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function deleteProject(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export function generateProjectId() {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
