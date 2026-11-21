"use client";

import { NoteContentRenderer } from "./NoteContentRenderer";

type NoteDetailBodyProps = {
  content: string;
  type: string;
};

export function NoteDetailBody({ content, type }: NoteDetailBodyProps) {
  return <NoteContentRenderer content={content} type={type} />;
}