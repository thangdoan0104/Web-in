import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ACCEPTED_MIME } from "@/lib/filecheck";
import { MAX_UPLOAD_BYTES } from "@/lib/storage";

const bodySchema = z.object({
  kind: z.enum(["PRINT_ARTWORK", "DESIGN_REFERENCE", "DESIGN_DRAFT"]),
  name: z.string().min(1).max(255),
  mime: z.string(),
  size: z.number().int().positive(),
});

const REFERENCE_MIME = [...ACCEPTED_MIME, "application/zip", "application/postscript", "image/vnd.adobe.photoshop"];

// Bước 1 của upload: tạo bản ghi, trả về id để PUT nội dung file
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Bạn cần đăng nhập" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const { kind, name, mime, size } = parsed.data;

  if (kind === "DESIGN_DRAFT" && session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  const allowed = kind === "PRINT_ARTWORK" ? ACCEPTED_MIME : REFERENCE_MIME;
  if (!allowed.includes(mime))
    return NextResponse.json({ error: "Định dạng chưa hỗ trợ. Hãy dùng PDF, JPG, PNG hoặc TIFF." }, { status: 400 });
  if (size > MAX_UPLOAD_BYTES)
    return NextResponse.json({ error: `File vượt quá ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB` }, { status: 400 });

  const file = await db.fileAsset.create({
    data: { ownerId: session.user.id, kind, originalName: name, mime, storageKey: "" },
  });
  await db.fileAsset.update({ where: { id: file.id }, data: { storageKey: `files/${file.id}/original` } });
  return NextResponse.json({ id: file.id });
}
