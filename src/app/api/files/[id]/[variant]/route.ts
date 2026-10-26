import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { openStream } from "@/lib/storage";

// Tải file gốc / ảnh xem trước / mockup. Chỉ chủ file hoặc admin được xem.
export async function GET(req: Request, { params }: { params: Promise<{ id: string; variant: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Bạn cần đăng nhập" }, { status: 401 });
  const { id, variant } = await params;
  const file = await db.fileAsset.findUnique({
    where: { id },
    include: { designRequest: { select: { userId: true } } },
  });
  const isOwner =
    file?.ownerId === session.user.id || (file?.kind === "DESIGN_DRAFT" && file.designRequest?.userId === session.user.id);
  if (!file || (!isOwner && session.user.role !== "ADMIN"))
    return NextResponse.json({ error: "Không tìm thấy file" }, { status: 404 });

  const key =
    variant === "original" ? file.storageKey : variant === "preview" ? file.previewKey : variant === "mockup" ? file.mockupKey : null;
  if (!key || !file.uploadedAt) return NextResponse.json({ error: "Không tìm thấy file" }, { status: 404 });

  const { stream, size } = await openStream(key);
  const type = variant === "original" ? file.mime : variant === "preview" ? "image/png" : "image/jpeg";
  const download = new URL(req.url).searchParams.has("download") || variant === "original";
  const name = variant === "original" ? file.originalName : `${variant}-${file.originalName.replace(/\.[^.]+$/, "")}.${variant === "preview" ? "png" : "jpg"}`;
  return new Response(stream, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(size),
      "Cache-Control": "private, max-age=3600",
      ...(download ? { "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}` } : {}),
    },
  });
}
