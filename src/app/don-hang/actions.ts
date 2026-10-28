"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Khách chỉ tự hủy được khi xưởng chưa xác nhận đơn
export async function cancelPrintOrder(code: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Bạn cần đăng nhập" };
  const order = await db.printOrder.findUnique({ where: { code } });
  if (!order || order.userId !== session.user.id) return { error: "Không tìm thấy đơn" };
  const result = await db.printOrder.updateMany({
    where: { id: order.id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  if (result.count === 0) return { error: "Xưởng đã xác nhận đơn, hãy gọi hotline nếu bạn muốn hủy" };
  await db.statusEvent.create({
    data: { printOrderId: order.id, label: "Khách đã hủy đơn", byName: session.user.name ?? session.user.email },
  });
  revalidatePath(`/don-hang/${code}`);
  return {};
}
