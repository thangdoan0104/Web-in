"use client";

import { useState } from "react";
import type { CheckItem, CheckStatus } from "@/lib/filecheck";

const ICON: Record<CheckStatus, { symbol: string; className: string }> = {
  pass: { symbol: "✓", className: "bg-emerald-600 text-white" },
  warn: { symbol: "!", className: "bg-amber-400 text-white" },
  fail: { symbol: "✕", className: "bg-red-600 text-white" },
};

export function CheckList({ items }: { items: CheckItem[] }) {
  const [open, setOpen] = useState<string[]>(items.filter((i) => i.status !== "pass").map((i) => i.key));
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const expanded = open.includes(item.key);
        return (
          <li key={item.key} className="rounded-lg border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => setOpen(expanded ? open.filter((k) => k !== item.key) : [...open, item.key])}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
              aria-expanded={expanded}
            >
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold ${ICON[item.status].className}`}>
                {ICON[item.status].symbol}
              </span>
              <span className="flex-1 font-medium">{item.label}</span>
              <span className="text-gray-400">{expanded ? "▴" : "▾"}</span>
            </button>
            {expanded && <p className="px-4 pb-4 pl-12 text-sm text-gray-600">{item.message}</p>}
          </li>
        );
      })}
    </ul>
  );
}
