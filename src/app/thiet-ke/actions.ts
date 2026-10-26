"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { newOrderCode } from "@/lib/codes";
import { db } from "@/lib/db";

const designSchema = z.object({
  productType: z.string().trim().min(1, "Chọn loại ấn phẩm"),
  sizeLabel: z.string().trim().min(1, "Nhập kích thước"),
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

  const files = await db.fileAsset.findMany({
    where: { id: { in: d.fileIds }, ownerId: session.user.id, kind: "DESIGN_REFERENCE", designRequestId: null },
    select: { id: true },
  });
  const request = await db.designRequest.create({
    data: {
      code: newOrderCode("TK"),
      userId: session.user.id,
      productType: d.productType,
      sizeLabel: d.sizeLabel,
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
