import { statusTone } from "@/lib/labels";

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone(status)}`}>{label}</span>;
}
