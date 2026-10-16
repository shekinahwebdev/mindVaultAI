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
      className="inline-flex rounded-[var(--mv-radius-control)] border border-border bg-mv-panel p-1"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-[calc(var(--mv-radius-control)-2px)] px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
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
