import { cn } from "@/lib/utils";

export type LibrarySection = "items" | "collections" | "tags";

type LibrarySectionTabsProps = {
  value: LibrarySection;
  onChange: (value: LibrarySection) => void;
};

const tabs: { id: LibrarySection; label: string }[] = [
  { id: "items", label: "All items" },
  { id: "collections", label: "Collections" },
  { id: "tags", label: "Tags" },
];

export function LibrarySectionTabs({ value, onChange }: LibrarySectionTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Library sections"
      className={cn(
        "grid w-full min-w-0 grid-cols-3 gap-1 rounded-[var(--mv-radius-control)] border border-border bg-mv-panel p-1",
        "sm:inline-flex sm:w-auto sm:grid-cols-none",
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "min-w-0 truncate rounded-[calc(var(--mv-radius-control)-2px)] px-2 py-1.5 text-[0.8125rem] font-medium transition-colors sm:px-3",
            value === tab.id
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
