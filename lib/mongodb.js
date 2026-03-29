import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

/** @type {{ conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }} */
let cached = globalThis.mongooseCache;

if (!cached) {
  cached = globalThis.mongooseCache = { conn: null, promise: null };
}

/**
 * Connect once per serverless instance (cached).
 * @returns {Promise<typeof mongoose>}
 */
export async function connectMongo() {
  if (!MONGODB_URI) throw new Error("Please add MONGODB_URI to your environment");

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
