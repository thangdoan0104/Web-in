import { NextResponse } from "next/server";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { MAX_UPLOAD_BYTES, saveStream, UploadTooLargeError } from "@/lib/storage";

// Bước 2 của upload: nội dung file gửi thẳng trong body, ghi xuống đĩa theo luồng
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Bạn cần đăng nhập" }, { status: 401 });
  const { id } = await params;
  const file = await db.fileAsset.findUnique({ where: { id } });
  if (!file || file.ownerId !== session.user.id) return NextResponse.json({ error: "Không tìm thấy file" }, { status: 404 });
  if (file.uploadedAt) return NextResponse.json({ error: "File đã được tải lên" }, { status: 409 });
  if (!req.body) return NextResponse.json({ error: "Thiếu nội dung file" }, { status: 400 });

  try {
    const size = await saveStream(file.storageKey, req.body as WebReadableStream<Uint8Array>, MAX_UPLOAD_BYTES);
    await db.fileAsset.update({ where: { id }, data: { sizeBytes: size, uploadedAt: new Date() } });
    return NextResponse.json({ ok: true, size });
  } catch (err) {
    if (err instanceof UploadTooLargeError) return NextResponse.json({ error: "File quá lớn" }, { status: 413 });
    throw err;
  }
}
