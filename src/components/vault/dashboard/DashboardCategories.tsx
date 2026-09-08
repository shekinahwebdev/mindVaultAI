import Link from "next/link";

import type { DashboardCategoryPreview } from "@/lib/vault/dashboard-queries";
import { vaultRoutes } from "@/lib/routes";

type DashboardCategoriesProps = {
  categories: DashboardCategoryPreview[];
  isEmpty: boolean;
};

export function DashboardCategories({
  categories,
  isEmpty,
}: DashboardCategoriesProps) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.92rem] text-white/88">Categories</h2>
        <Link
          href={vaultRoutes.categories}
          className="text-[0.68rem] tracking-[0.12em] text-white/40 uppercase transition-colors hover:text-white/62"
        >
          View all categories
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="mt-4 text-[0.84rem] leading-relaxed text-white/40">
          {isEmpty
            ? "Create categories when you're ready to group what you save."
            : "No categories yet. Organize your vault from the Categories page."}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
            >
              <span className="truncate text-[0.82rem] text-white/72">
                {category.name}
              </span>
              <span className="shrink-0 text-[0.72rem] text-white/34">
                {category.noteCount === 1
                  ? "1 note"
                  : `${category.noteCount} notes`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
