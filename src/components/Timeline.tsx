import type { StatusEvent } from "@prisma/client";
import { formatDate } from "@/lib/labels";

export function Timeline({ events }: { events: StatusEvent[] }) {
  return (
    <ol className="relative space-y-5 border-l-2 border-brand-100 pl-6">
      {events.map((e, i) => (
        <li key={e.id} className="relative">
          <span className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-white ${i === 0 ? "bg-brand-600" : "bg-brand-100"}`} />
          <p className="font-semibold">{e.label}</p>
          <p className="text-xs text-gray-500">{formatDate(e.createdAt)}{e.byName ? ` · ${e.byName}` : ""}</p>
          {e.note && <p className="mt-1 text-sm text-gray-600">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}
