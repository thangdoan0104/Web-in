import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

// Lưu file trên ổ đĩa server. Khi chuyển sang R2/S3 chỉ cần thay các hàm trong file này.
const ROOT = path.resolve(process.env.STORAGE_DIR ?? "./storage");

export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB ?? 300) * 1024 * 1024;

export function storagePath(key: string): string {
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT + path.sep)) throw new Error("Invalid storage key");
  return full;
}

export class UploadTooLargeError extends Error {}

export async function saveStream(key: string, body: WebReadableStream<Uint8Array>, maxBytes: number): Promise<number> {
  const target = storagePath(key);
  await mkdir(path.dirname(target), { recursive: true });
  let written = 0;
  const limiter = new Transform({
    transform(chunk: Buffer, _enc, cb) {
      written += chunk.length;
      if (written > maxBytes) cb(new UploadTooLargeError("File quá lớn"));
      else cb(null, chunk);
    },
  });
  await pipeline(Readable.fromWeb(body), limiter, createWriteStream(target));
  return written;
}

export async function saveBuffer(key: string, data: Buffer): Promise<void> {
  const target = storagePath(key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

export async function readBuffer(key: string): Promise<Buffer> {
  return readFile(storagePath(key));
}

export async function openStream(key: string): Promise<{ stream: ReadableStream; size: number }> {
  const full = storagePath(key);
  const { size } = await stat(full);
  return { stream: Readable.toWeb(createReadStream(full)) as ReadableStream, size };
}
