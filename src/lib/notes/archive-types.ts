export type SerializedArchivedNoteItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  categoryId: string | null;
  tags: string[];
  archivedAt: string;
  updatedAt: string;
  sourceUrl: string | null;
};

export type ArchiveOverviewStats = {
  total: number;
  noteCount: number;
  codeCount: number;
  linkCount: number;
  articleCount: number;
};
