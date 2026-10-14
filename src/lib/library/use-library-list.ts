"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { routes } from "@/lib/routes";

import { fetchLibrary, LIBRARY_LOAD_ERROR } from "./library-client";
import type { LibrarySortOption, LibraryTypeFilter } from "./library-list-config";
import { LIBRARY_PAGE_SIZE } from "./library-list-config";
import type { SerializedLibraryItem } from "./library-types";

type UseLibraryListParams = {
  typeFilter: LibraryTypeFilter;
  sort: LibrarySortOption;
  searchQuery: string;
  page: number;
};

export function useLibraryList({
  typeFilter,
  sort,
  searchQuery,
  page,
}: UseLibraryListParams) {
  const router = useRouter();
  const [items, setItems] = useState<SerializedLibraryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

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

      const { response, data } = await fetchLibrary({
        page,
        limit: LIBRARY_PAGE_SIZE,
        type: typeFilter,
        sort,
        search: searchQuery.trim() || null,
      });

      if (cancelled) {
        return;
      }

      if (response.status === 401) {
        router.push(routes.signIn);
        return;
      }

      if (!data || !response.ok || !data.ok) {
        setError(LIBRARY_LOAD_ERROR);
        if (!append) {
          setItems([]);
          setTotal(0);
          setTotalPages(0);
        }
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      setTotal(data.library.pagination.total);
      setTotalPages(data.library.pagination.totalPages);
      setItems((current) =>
        append ? [...current, ...data.library.items] : data.library.items,
      );
      setLoading(false);
      setLoadingMore(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [page, router, searchQuery, sort, typeFilter]);

  return {
    items,
    total,
    totalPages,
    loading,
    loadingMore,
    error,
    setItems,
  };
}
