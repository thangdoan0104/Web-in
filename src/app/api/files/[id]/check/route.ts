import { NextResponse } from "next/server";
import sharp from "sharp";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkPrintFile } from "@/lib/filecheck";
import { renderMockup } from "@/lib/mockup";
import { calculatePrice, parseConfig } from "@/lib/pricing";
import { saveBuffer, storagePath } from "@/lib/storage";

export const maxDuration = 120;

const bodySchema = z.object({
  productSlug: z.string(),
  sizeCode: z.string(),
  customWidthMm: z.number().optional(),
  customHeightMm: z.number().optional(),
});

// Bước 3: kiểm tra file theo khổ in đã chọn, tạo ảnh xem trước + mockup
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Bạn cần đăng nhập" }, { status: 401 });
  const { id } = await params;
  const file = await db.fileAsset.findUnique({ where: { id } });
  if (!file || file.ownerId !== session.user.id || !file.uploadedAt)
    return NextResponse.json({ error: "Không tìm thấy file" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const product = await db.product.findUnique({ where: { slug: parsed.data.productSlug } });
  if (!product) return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
  const config = parseConfig(product.config);
  // Dùng hàm tính giá để chuẩn hóa kích thước (mẫu sẵn hoặc tùy chỉnh)
  const quote = calculatePrice(config, {
    ...parsed.data,
    materialCode: config.materials[0].code,
    finishingCodes: [],
    quantity: config.minQuantity,
  });
  if (!quote.ok) return NextResponse.json({ error: quote.error }, { status: 400 });

  try {
    const { result, preview } = await checkPrintFile(storagePath(file.storageKey), file.mime, {
      widthMm: quote.widthMm,
      heightMm: quote.heightMm,
      bleedMm: config.bleedMm,
      dpi: config.dpi,
    });
    const previewMeta = await sharp(preview).metadata();
    const fileLandscape = (previewMeta.width ?? 1) > (previewMeta.height ?? 1);
    const targetLandscape = quote.widthMm > quote.heightMm;
    const ratio =
      fileLandscape !== targetLandscape && quote.widthMm !== quote.heightMm
        ? quote.heightMm / quote.widthMm
        : quote.widthMm / quote.heightMm;
    const mockup = await renderMockup(config.mockup, preview, ratio);

    const previewKey = `files/${id}/preview.png`;
    const mockupKey = `files/${id}/mockup.jpg`;
    await saveBuffer(previewKey, preview);
    await saveBuffer(mockupKey, mockup);
    await db.fileAsset.update({
      where: { id },
      data: { check: JSON.parse(JSON.stringify(result)), previewKey, mockupKey },
    });
    return NextResponse.json({
      check: result,
      previewUrl: `/api/files/${id}/preview?v=${Date.now()}`,
      mockupUrl: `/api/files/${id}/mockup?v=${Date.now()}`,
    });
  } catch (err) {
    console.error("File check failed", err);
    return NextResponse.json(
      { error: "Không đọc được file. File có thể bị hỏng hoặc được bảo vệ bằng mật khẩu." },
      { status: 422 },
    );
  }
}
