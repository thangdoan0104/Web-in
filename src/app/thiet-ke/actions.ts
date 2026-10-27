"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { newOrderCode } from "@/lib/codes";
import { db } from "@/lib/db";
import { CUSTOM_SIZE, productConfigSchema } from "@/lib/pricing";

const designSchema = z.object({
  productSlug: z.string().min(1, "Chọn loại ấn phẩm"),
  sizeCode: z.string().min(1, "Chọn kích thước"),
  customWidthCm: z.number().positive().optional(),
  customHeightCm: z.number().positive().optional(),
  brief: z.string().trim().min(20, "Mô tả brief ít nhất 20 ký tự để đội thiết kế hiểu rõ yêu cầu"),
  deadline: z.string().optional(),
  budget: z.number().int().min(0).optional(),
  contactPhone: z.string().trim().regex(/^0\d{9,10}$/, "Số điện thoại không hợp lệ"),
  fileIds: z.array(z.string()).max(10),
});

export type DesignInput = z.infer<typeof designSchema>;

export async function createDesignRequest(input: DesignInput): Promise<{ error: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Phiên đăng nhập đã hết, hãy đăng nhập lại" };
  const parsed = designSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  // Loại và kích thước phải nằm trong bảng giá, không nhận chữ tự nhập
  const product = await db.product.findUnique({ where: { slug: d.productSlug } });
  const config = product?.active ? productConfigSchema.safeParse(product.config) : null;
  if (!product || !config?.success) return { error: "Sản phẩm không còn nhận đặt" };
  let size: { widthMm: number; heightMm: number; label: string };
  if (d.sizeCode === CUSTOM_SIZE) {
    const max = config.data.maxCustomMm, w = Math.round((d.customWidthCm ?? 0) * 10), h = Math.round((d.customHeightCm ?? 0) * 10);
    if (!config.data.allowCustomSize) return { error: "Sản phẩm này chỉ nhận kích thước có sẵn" };
    if (w < 100 || h < 100 || w > max || h > max) return { error: `Kích thước tùy chỉnh từ 10 đến ${max / 10} cm mỗi cạnh` };
    size = { widthMm: w, heightMm: h, label: `${w / 10} x ${h / 10} cm` };
  } else {
    const s = config.data.sizes.find((x) => x.code === d.sizeCode);
    if (!s) return { error: "Kích thước không hợp lệ" };
    size = s;
  }

  const files = await db.fileAsset.findMany({
    where: { id: { in: d.fileIds }, ownerId: session.user.id, kind: "DESIGN_REFERENCE", designRequestId: null },
    select: { id: true },
  });
  const request = await db.designRequest.create({
    data: {
      code: newOrderCode("TK"),
      userId: session.user.id,
      productType: product.name,
      widthMm: size.widthMm,
      heightMm: size.heightMm,
      sizeLabel: size.label,
      brief: d.brief,
      deadline: d.deadline ? new Date(d.deadline) : null,
      budget: d.budget || null,
      contactPhone: d.contactPhone,
      files: { connect: files },
      history: { create: { label: "Đã gửi yêu cầu thiết kế", byName: session.user.name ?? session.user.email } },
    },
  });
  redirect(`/thiet-ke/${request.code}?moi=1`);
}

// Khách duyệt bản thiết kế hoặc yêu cầu sửa
export async function respondToDraft(code: string, approve: boolean, feedback: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Bạn cần đăng nhập" };
  const request = await db.designRequest.findUnique({ where: { code } });
  if (!request || request.userId !== session.user.id) return { error: "Không tìm thấy đơn" };
  if (request.status !== "WAITING_APPROVAL") return { error: "Đơn không ở trạng thái chờ duyệt" };
  if (!approve && feedback.trim().length < 5) return { error: "Hãy ghi rõ cần sửa gì" };

  await db.designRequest.update({
    where: { id: request.id },
    data: {
      status: approve ? "APPROVED" : "REVISING",
      history: {
        create: {
          label: approve ? "Khách đã duyệt thiết kế" : "Khách yêu cầu chỉnh sửa",
          note: feedback.trim() || null,
          byName: session.user.name ?? session.user.email,
        },
      },
    },
  });
  revalidatePath(`/thiet-ke/${code}`);
  return {};
}
