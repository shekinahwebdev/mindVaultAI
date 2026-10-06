"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  fetchArchive,
  type ArchiveOverviewStats,
  type SerializedArchivedNoteItem,
} from "@/lib/notes/archive-client";
import type { ArchiveSortOption } from "@/lib/notes/archive-validation";
import { routes } from "@/lib/routes";

const ARCHIVE_LOAD_ERROR = "Could not load your archive. Please try again.";

type UseArchiveListOptions = {
  typeFilter?: string;
  categoryFilter?: string;
  sort: ArchiveSortOption;
  searchQuery: string;
};

export function useArchiveList({
  typeFilter = "",
  categoryFilter = "",
  sort,
  searchQuery,
}: UseArchiveListOptions) {
  const router = useRouter();
  const [notes, setNotes] = useState<SerializedArchivedNoteItem[]>([]);
  const [stats, setStats] = useState<ArchiveOverviewStats>({
    total: 0,
    noteCount: 0,
    codeCount: 0,
    linkCount: 0,
    articleCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useMemo(
    () => ({
      sort,
      q: searchQuery.trim() || undefined,
      type: typeFilter || undefined,
      categoryId: categoryFilter || undefined,
    }),
    [categoryFilter, searchQuery, sort, typeFilter],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      const { response, data } = await fetchArchive(params);

      if (cancelled) return;

      if (response.status === 401) {
        router.replace(routes.signIn);
        return;
      }

      if (!data || !data.ok) {
        setError(data?.message ?? ARCHIVE_LOAD_ERROR);
        setNotes([]);
        setLoading(false);
        return;
      }

      setNotes(data.notes);
      setStats(data.stats);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [params, router]);

  function removeNote(id: string) {
    setNotes((current) => current.filter((note) => note.id !== id));
    setStats((current) => ({
      ...current,
      total: Math.max(0, current.total - 1),
    }));
  }

  function clearAll() {
    setNotes([]);
    setStats({
      total: 0,
      noteCount: 0,
      codeCount: 0,
      linkCount: 0,
      articleCount: 0,
    });
  }

  async function refresh() {
    const { data } = await fetchArchive(params);
    if (data?.ok) {
      setNotes(data.notes);
      setStats(data.stats);
    }
  }

  return {
    notes,
    stats,
    loading,
    error,
    removeNote,
    clearAll,
    refresh,
  };
}
