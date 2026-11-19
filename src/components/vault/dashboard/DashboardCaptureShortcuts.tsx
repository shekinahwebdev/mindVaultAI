"use client";

import Link from "next/link";
import { Code2, FileText, Link2, Quote, StickyNote } from "lucide-react";

import { NoteType } from "@/generated/prisma/enums";
import { dashboardCaptureShortcutClassName } from "./dashboard-ui";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const shortcuts = [
  {
    label: "Note",
    href: `${vaultRoutes.capture}?type=${NoteType.NOTE}`,
    icon: StickyNote,
  },
  {
    label: "Link",
    href: `${vaultRoutes.capture}?type=${NoteType.LINK}`,
    icon: Link2,
  },
  {
    label: "Document",
    href: vaultRoutes.documents,
    icon: FileText,
  },
  {
    label: "Code",
    href: `${vaultRoutes.capture}?type=${NoteType.CODE}`,
    icon: Code2,
  },
  {
    label: "Quote",
    href: `${vaultRoutes.capture}?type=${NoteType.QUOTE}`,
    icon: Quote,
  },
] as const;

export function DashboardCaptureShortcuts() {
  return (
    <section aria-label="Capture shortcuts" className="min-w-0">
      <h2 className="mb-2 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-mv-faint">
        Capture
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(dashboardCaptureShortcutClassName, "flex items-center gap-2.5")}
              >
                <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}