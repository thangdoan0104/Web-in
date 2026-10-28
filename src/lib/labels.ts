import type { DesignStatus, PaymentStatus, PrintStatus } from "@prisma/client";

export const PRINT_STATUS_LABEL: Record<PrintStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PREPRESS: "Đang chế bản",
  PRINTING: "Đang in",
  FINISHING: "Gia công",
  READY: "Sẵn sàng giao/nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const PRINT_STATUS_FLOW: PrintStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPRESS",
  "PRINTING",
  "FINISHING",
  "READY",
  "COMPLETED",
];

export const DESIGN_STATUS_LABEL: Record<DesignStatus, string> = {
  NEW: "Mới",
  BRIEF_RECEIVED: "Đã nhận brief",
  DESIGNING: "Đang thiết kế",
  WAITING_APPROVAL: "Chờ khách duyệt",
  REVISING: "Đang chỉnh sửa",
  APPROVED: "Đã chốt",
  CANCELLED: "Đã hủy",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  DEPOSITED: "Đã cọc",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
};


export function statusTone(status: string): string {
  switch (status) {
    case "COMPLETED":
    case "APPROVED":
    case "PAID":
      return "bg-emerald-100 text-emerald-800";
    case "CANCELLED":
    case "REFUNDED":
      return "bg-gray-200 text-gray-700";
    case "PENDING":
    case "NEW":
    case "UNPAID":
    case "WAITING_APPROVAL":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-sky-100 text-sky-800";
  }
}

export function formatDate(date: Date): string {
  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
