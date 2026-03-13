import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { flangesDatabaseRoot } from "@/lib/flanges-config";

function getContentType(ext) {
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder");
  const file = searchParams.get("file");

  if (!folder || !file) {
    return NextResponse.json(
      { error: "Missing folder or file parameter" },
      { status: 400 }
    );
  }

  const safeFolder = folder.replace(/[^a-z0-9]/gi, "");
  const safeFile = path.basename(file);

  const filePath = path.join(flangesDatabaseRoot, safeFolder, safeFile);

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(safeFile).toLowerCase();
    const contentType = getContentType(ext);

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}

