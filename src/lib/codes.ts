// Mã đơn dễ đọc: IN-261026-K7Q2 (đơn in), TK-261026-K7Q2 (đơn thiết kế)
export function newOrderCode(prefix: "IN" | "TK"): string {
  const now = new Date(Date.now() + 7 * 3600_000); // giờ Việt Nam
  const ymd = now.toISOString().slice(2, 10).replaceAll("-", "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}-${ymd}-${suffix}`;
}
