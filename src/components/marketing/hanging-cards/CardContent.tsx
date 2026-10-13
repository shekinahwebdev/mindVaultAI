import { Code2, FileText, Link2, Search, Sparkles } from "lucide-react";

function CardHeading({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof FileText;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        aria-hidden
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-white/20 text-white/90"
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-[0.875rem] leading-tight font-medium tracking-[-0.02em] text-white">{title}</p>
        <p className="mt-1 line-clamp-2 text-[0.6875rem] leading-snug text-[#A3A3A3] md:text-[0.72rem]">
          {description}
        </p>
      </div>
    </div>
  );
}

export function SaveAnythingContent() {
  return (
    <>
      <CardHeading
        icon={FileText}
        title="Save Anything"
        description="Capture notes, links, ideas, code, and more."
      />
      <div aria-hidden className="mt-auto flex items-end gap-2 pt-3">
        <div className="w-[44%] rounded-md border border-white/15 bg-black px-2 py-2">
          <div className="h-[3px] w-6 rounded-full bg-neutral-500" />
          <div className="mt-1.5 h-[3px] w-full rounded-full bg-neutral-600" />
          <div className="mt-1 h-[3px] w-4/5 rounded-full bg-neutral-700" />
        </div>
        <div className="flex h-9 w-[28%] items-center justify-center rounded-md border border-white/15 bg-black">
          <Link2 className="size-4 text-neutral-400" strokeWidth={1.7} />
        </div>
        <div className="flex size-9 items-center justify-center rounded-md border border-white/15 text-neutral-300">
          <Code2 className="size-4" strokeWidth={1.7} />
        </div>
      </div>
    </>
  );
}

const organiseChips = ["Study", "Work", "Ideas", "Projects"] as const;

export function OrganiseAutomaticallyContent() {
  return (
    <>
      <CardHeading
        icon={Sparkles}
        title="Organise Automatically"
        description="AI-powered categories and tags."
      />
      <div aria-hidden className="mt-auto grid grid-cols-2 gap-1.5 pt-3">
        {organiseChips.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-white/20 px-2 py-1 text-center text-[0.68rem] leading-none text-[#A3A3A3]"
          >
            {chip}
          </span>
        ))}
      </div>
    </>
  );
}

export function FindInstantlyContent() {
  return (
    <>
      <CardHeading
        icon={Search}
        title="Find Instantly"
        description="Powerful semantic search across your knowledge."
      />
      <div
        aria-hidden
        className="mt-auto flex items-center gap-2 rounded-md border border-white/20 bg-black px-2.5 py-2 pt-3 text-[#A3A3A3]"
      >
        <Search className="size-3.5 shrink-0 text-neutral-400" strokeWidth={1.8} />
        <span className="min-w-0 truncate text-[0.7rem]">Search…</span>
      </div>
    </>
  );
}
