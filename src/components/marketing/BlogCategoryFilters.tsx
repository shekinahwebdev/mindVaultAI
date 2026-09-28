"use client";

import type { BlogCategoryFilter } from "@/lib/marketing/blog-content";
import { blogCategories } from "@/lib/marketing/blog-content";
import { cn } from "@/lib/utils";

type BlogCategoryFiltersProps = {
  value: BlogCategoryFilter;
  onChange: (value: BlogCategoryFilter) => void;
};

export function BlogCategoryFilters({ value, onChange }: BlogCategoryFiltersProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter posts by category"
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
    >
      {blogCategories.map((category) => {
        const active = value === category.id;
        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(category.id)}
            className={cn(
              "min-h-9 rounded-full px-3.5 text-[0.8125rem] font-medium transition-colors sm:px-4",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
              active
                ? "bg-white text-black"
                : "border border-white/10 bg-white/[0.04] text-white/55 hover:border-white/15 hover:text-white/80",
            )}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
