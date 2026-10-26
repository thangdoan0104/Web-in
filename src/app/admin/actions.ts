"use server";

import type { DesignStatus, PaymentStatus, PrintStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { DESIGN_STATUS_LABEL, PAYMENT_STATUS_LABEL, PRINT_STATUS_LABEL } from "@/lib/labels";
import { formatVnd, productConfigSchema } from "@/lib/pricing";
import { requireAdmin } from "@/lib/session";

type Result = { error?: string; ok?: boolean };

const PAYMENT_STATUSES = Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[];

function readPayment(formData: FormData) {
  const status = String(formData.get("paymentStatus")) as PaymentStatus;
  const paidAmount = Number(formData.get("paidAmount") ?? 0);
  if (!PAYMENT_STATUSES.includes(status) || !Number.isFinite(paidAmount) || paidAmount < 0) return null;
  return { status, paidAmount: Math.round(paidAmount), note: String(formData.get("note") ?? "").trim() || null };
}

export async function updatePrintStatus(id: string, _prev: Result, formData: FormData): Promise<Result> {
  const admin = await requireAdmin();
  const status = String(formData.get("status")) as PrintStatus;
  if (!(status in PRINT_STATUS_LABEL)) return { error: "Trạng thái không hợp lệ" };
  const note = String(formData.get("note") ?? "").trim() || null;
  await db.printOrder.update({
    where: { id },
    data: { status, history: { create: { label: PRINT_STATUS_LABEL[status], note, byName: admin.name ?? "Xưởng in" } } },
  });
  revalidatePath(`/admin/don-in/${id}`);
  return { ok: true };
}

export async function updatePrintPayment(id: string, _prev: Result, formData: FormData): Promise<Result> {
  const admin = await requireAdmin();
  const p = readPayment(formData);
  if (!p) return { error: "Dữ liệu thanh toán không hợp lệ" };
  await db.printOrder.update({
    where: { id },
    data: {
      paymentStatus: p.status,
      paidAmount: p.paidAmount,
      history: {
        create: { label: `Thanh toán: ${PAYMENT_STATUS_LABEL[p.status]} (${formatVnd(p.paidAmount)})`, note: p.note, byName: admin.name ?? "Xưởng in" },
      },
    },
  });
  revalidatePath(`/admin/don-in/${id}`);
  return { ok: true };
}

export async function updatePrintPrice(id: string, _prev: Result, formData: FormData): Promise<Result> {
  const admin = await requireAdmin();
  const price = Math.round(Number(formData.get("price")));
  if (!Number.isFinite(price) || price < 0) return { error: "Giá không hợp lệ" };
  const note = String(formData.get("note") ?? "").trim() || null;
  await db.printOrder.update({
    where: { id },
    data: { price, history: { create: { label: `Cập nhật giá: ${formatVnd(price)}`, note, byName: admin.name ?? "Xưởng in" } } },
  });
  revalidatePath(`/admin/don-in/${id}`);
  return { ok: true };
}

export async function updateDesign(id: string, _prev: Result, formData: FormData): Promise<Result> {
  const admin = await requireAdmin();
  const status = String(formData.get("status")) as DesignStatus;
  if (!(status in DESIGN_STATUS_LABEL)) return { error: "Trạng thái không hợp lệ" };
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw ? Math.round(Number(priceRaw)) : null;
  if (price !== null && (!Number.isFinite(price) || price < 0)) return { error: "Giá không hợp lệ" };
  const note = String(formData.get("note") ?? "").trim() || null;

  const current = await db.designRequest.findUniqueOrThrow({ where: { id } });
  const changes: string[] = [];
  if (current.status !== status) changes.push(DESIGN_STATUS_LABEL[status]);
  if (current.price !== price && price !== null) changes.push(`Báo giá: ${formatVnd(price)}`);
  await db.designRequest.update({
    where: { id },
    data: {
      status,
      price,
      ...(changes.length || note
        ? { history: { create: { label: changes.join(" · ") || "Cập nhật", note, byName: admin.name ?? "Đội thiết kế" } } }
        : {}),
    },
  });
  revalidatePath(`/admin/thiet-ke/${id}`);
  return { ok: true };
}

export async function updateDesignPayment(id: string, _prev: Result, formData: FormData): Promise<Result> {
  const admin = await requireAdmin();
  const p = readPayment(formData);
  if (!p) return { error: "Dữ liệu thanh toán không hợp lệ" };
  await db.designRequest.update({
    where: { id },
    data: {
      paymentStatus: p.status,
      paidAmount: p.paidAmount,
      history: {
        create: { label: `Thanh toán: ${PAYMENT_STATUS_LABEL[p.status]} (${formatVnd(p.paidAmount)})`, note: p.note, byName: admin.name ?? "Đội thiết kế" },
      },
    },
  });
  revalidatePath(`/admin/thiet-ke/${id}`);
  return { ok: true };
}

// Gắn bản nháp (đã upload qua /api/files) vào đơn thiết kế và chuyển sang chờ khách duyệt
export async function attachDesignDraft(id: string, fileId: string): Promise<Result> {
  const admin = await requireAdmin();
  const file = await db.fileAsset.findUnique({ where: { id: fileId } });
  if (!file || file.kind !== "DESIGN_DRAFT" || file.ownerId !== admin.id || !file.uploadedAt) return { error: "File không hợp lệ" };
  await db.designRequest.update({
    where: { id },
    data: {
      status: "WAITING_APPROVAL",
      files: { connect: { id: fileId } },
      history: { create: { label: "Đã gửi bản thiết kế, chờ khách duyệt", note: file.originalName, byName: admin.name ?? "Đội thiết kế" } },
    },
  });
  revalidatePath(`/admin/thiet-ke/${id}`);
  return { ok: true };
}

export async function saveProduct(
  id: string,
  input: { name: string; description: string; active: boolean; config: unknown },
): Promise<Result> {
  await requireAdmin();
  if (input.name.trim().length < 2) return { error: "Nhập tên sản phẩm" };
  const parsed = productConfigSchema.safeParse(input.config);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: `Cấu hình chưa hợp lệ ở "${issue.path.join(".")}": ${issue.message}` };
  }
  const codes = (list: { code: string }[]) => new Set(list.map((x) => x.code)).size === list.length;
  if (!codes(parsed.data.sizes) || !codes(parsed.data.materials) || !codes(parsed.data.finishings))
    return { error: "Mã của các tùy chọn không được trùng nhau" };
  await db.product.update({
    where: { id },
    data: { name: input.name.trim(), description: input.description.trim(), active: input.active, config: parsed.data },
  });
  revalidatePath("/admin/san-pham");
  return { ok: true };
}
