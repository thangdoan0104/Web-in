"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { newOrderCode } from "@/lib/codes";
import { db } from "@/lib/db";
import type { FileCheckResult } from "@/lib/filecheck";
import { calculatePrice, parseConfig } from "@/lib/pricing";

const orderSchema = z.object({
  productSlug: z.string(),
  options: z.object({
    sizeCode: z.string(),
    customWidthMm: z.number().optional(),
    customHeightMm: z.number().optional(),
    materialCode: z.string(),
    finishingCodes: z.array(z.string()),
    quantity: z.number().int(),
  }),
  fileId: z.string(),
  acceptWarnings: z.boolean(),
  contactName: z.string().trim().min(2, "Nhập tên người nhận"),
  contactPhone: z.string().trim().regex(/^0\d{9,10}$/, "Số điện thoại không hợp lệ"),
  deliveryMethod: z.enum(["PICKUP", "SHIP"]),
  address: z.string().trim().optional(),
  note: z.string().trim().max(2000).optional(),
});

export type CreateOrderInput = z.infer<typeof orderSchema>;

export async function createPrintOrder(input: CreateOrderInput): Promise<{ error: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Phiên đăng nhập đã hết, hãy đăng nhập lại" };
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;
  if (data.deliveryMethod === "SHIP" && !data.address) return { error: "Nhập địa chỉ giao hàng" };

  const product = await db.product.findUnique({ where: { slug: data.productSlug } });
  if (!product?.active) return { error: "Sản phẩm không còn bán" };
  // Giá luôn tính lại ở server, không tin giá gửi từ trình duyệt
  const quote = calculatePrice(parseConfig(product.config), data.options);
  if (!quote.ok) return { error: quote.error };

  const file = await db.fileAsset.findUnique({ where: { id: data.fileId } });
  if (!file || file.ownerId !== session.user.id || file.kind !== "PRINT_ARTWORK" || file.printOrderId)
    return { error: "File in không hợp lệ, hãy tải lại" };
  const check = file.check as FileCheckResult | null;
  if (!check) return { error: "File chưa được kiểm tra" };
  if (check.target.widthMm !== quote.widthMm || check.target.heightMm !== quote.heightMm)
    return { error: "Bạn đã đổi kích thước sau khi kiểm tra file, hãy kiểm tra lại" };
  if (check.worst !== "pass" && !data.acceptWarnings) return { error: "Hãy xác nhận các cảnh báo về file" };

  const order = await db.printOrder.create({
    data: {
      code: newOrderCode("IN"),
      userId: session.user.id,
      productId: product.id,
      options: {
        ...data.options,
        sizeLabel: quote.sizeLabel,
        materialLabel: quote.materialLabel,
        finishingLabels: quote.finishingLabels,
        unitPrice: quote.unitPrice,
        discountPercent: quote.discountPercent,
      },
      widthMm: quote.widthMm,
      heightMm: quote.heightMm,
      quantity: data.options.quantity,
      price: quote.total,
      acceptedWarnings: check.worst !== "pass",
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      deliveryMethod: data.deliveryMethod,
      address: data.deliveryMethod === "SHIP" ? data.address : null,
      note: data.note || null,
      files: { connect: { id: file.id } },
      history: { create: { label: "Đã tạo đơn", note: "Đơn đang chờ xưởng xác nhận", byName: session.user.name ?? session.user.email } },
    },
  });
  redirect(`/don-hang/${order.code}?moi=1`);
}
