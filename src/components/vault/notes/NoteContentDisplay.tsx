import { cn } from "@/lib/utils";

type NoteContentDisplayProps = {
  content: string;
  type: string;
};

export function NoteContentDisplay({ content, type }: NoteContentDisplayProps) {
  if (type === "CODE") {
    return (
      <pre
        className={cn(
          "overflow-x-auto rounded-xl border border-white/[0.08] bg-black/30 px-4 py-4",
          "font-mono text-[0.84rem] leading-relaxed whitespace-pre-wrap text-white/78",
        )}
      >
        {content}
      </pre>
    );
  }

  if (type === "QUOTE") {
    return (
      <blockquote
        className={cn(
          "rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-4",
          "border-l-2 border-l-white/20 text-[0.94rem] leading-relaxed whitespace-pre-wrap text-white/72 italic",
        )}
      >
        {content}
      </blockquote>
    );
  }

  return (
    <div className="text-[0.94rem] leading-relaxed whitespace-pre-wrap text-white/78">
      {content}
    </div>
  );
}
