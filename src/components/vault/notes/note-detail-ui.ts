import { cn } from "@/lib/utils";

/** Side panel width on desktop (~240–280px). */
export const noteDetailRailWidthClassName = "w-[16.5rem] xl:w-[17.5rem]";

export const noteDetailWorkspaceClassName = cn(
  "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
  "rounded-[var(--mv-radius-card)] border border-border bg-surface",
);

export const noteDetailArticleMeasureClassName = "mx-auto w-full max-w-[42rem] min-w-0";

/** Read / edit body typography — scoped to note content only (16px base). */
export const noteReadingBodyClassName = cn(
  "text-[1rem] leading-[1.65] text-foreground/90",
);

export const noteProseClassName = cn(
  "note-prose",
  noteReadingBodyClassName,
  "[&_p]:mb-3 [&_p:last-child]:mb-0",
  "[&_blockquote]:mb-3.5 [&_blockquote]:mt-0",
  "[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-[1.375rem] [&_h2]:font-serif [&_h2]:font-medium [&_h2]:leading-snug [&_h2]:tracking-tight",
  "[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-[1.125rem] [&_h3]:font-serif [&_h3]:font-medium [&_h3]:leading-snug",
  "[&_h4,&_h5,&_h6]:mb-1.5 [&_h4,&_h5,&_h6]:mt-3 [&_h4,&_h5,&_h6]:text-base [&_h4,&_h5,&_h6]:font-semibold",
  "[&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-[1.5rem] [&_h1]:font-serif [&_h1]:font-medium [&_h1]:leading-snug [&_h1:first-child]:mt-0",
  "[&_h2:first-child,&_h3:first-child]:mt-0",
  "[&_ul,&_ol]:mb-3.5 [&_ul,&_ol]:mt-0",
  "[&_li]:leading-[1.65]",
  "[&_ul>li+li,&_ol>li+li]:mt-1.5",
  "[&_a]:break-all",
  "[&_img]:my-3.5 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-[var(--mv-radius-control)]",
  "[&_table]:my-3.5 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto",
);

export const noteEditorBodyClassName = cn(
  noteReadingBodyClassName,
  "leading-[1.65]",
);