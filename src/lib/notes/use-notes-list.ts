"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  fetchNotes,
  NOTES_LOAD_ERROR,
  type NotesListParams,
} from "@/lib/notes/notes-client";
import type { NoteSortOption } from "@/lib/notes/notes-list-config";
import type { SerializedNote } from "@/lib/notes/serialize";
import { routes } from "@/lib/routes";

type UseNotesListOptions = {
  typeFilter: string;
  categoryFilter: string;
  sort: NoteSortOption;
  searchQuery: string;
  page: number;
};

export function useNotesList({
  typeFilter,
  categoryFilter,
  sort,
  searchQuery,
  page,
}: UseNotesListOptions) {
  const router = useRouter();
  const [notes, setNotes] = useState<SerializedNote[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const listParams = useMemo((): Omit<NotesListParams, "page"> => {
    const params: Omit<NotesListParams, "page"> = {
      sort,
      q: searchQuery || undefined,
    };

    if (typeFilter) {
      params.type = typeFilter;
    }

    if (categoryFilter) {
      params.categoryId = categoryFilter;
    }

    return params;
  }, [categoryFilter, searchQuery, sort, typeFilter]);

  useEffect(() => {
    let cancelled = false;
    const append = page > 1;

    void (async () => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const { response, data } = await fetchNotes({
          ...listParams,
          page,
        });

        if (cancelled) {
          return;
        }

        if (response.status === 401) {
          router.push(routes.signIn);
          return;
        }

        if (!data || !response.ok || !data.ok) {
          setError(NOTES_LOAD_ERROR);
          if (!append) {
            setNotes([]);
            setTotal(0);
            setTotalPages(0);
          }
          return;
        }

        setNotes((current) =>
          append ? [...current, ...data.notes] : data.notes,
        );
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } catch {
        if (!cancelled) {
          setError(NOTES_LOAD_ERROR);
          if (!append) {
            setNotes([]);
            setTotal(0);
            setTotalPages(0);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [listParams, page, router]);

  return {
    notes,
    total,
    totalPages,
    loading,
    loadingMore,
    error,
    setNotes,
  };
}
