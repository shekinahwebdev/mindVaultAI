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
          "overflow-x-auto rounded-xl border border-border bg-mv-panel px-4 py-4",
          "font-mono text-[0.84rem] leading-relaxed whitespace-pre-wrap text-foreground/85",
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
          "rounded-xl border border-border bg-mv-panel px-4 py-4",
          "border-l-2 border-l-foreground/20 text-[0.94rem] leading-relaxed whitespace-pre-wrap text-foreground/80 italic",
        )}
      >
        {content}
      </blockquote>
    );
  }

  return (
    <div className="text-[0.94rem] leading-relaxed whitespace-pre-wrap text-foreground/85">
      {content}
    </div>
  );
}
