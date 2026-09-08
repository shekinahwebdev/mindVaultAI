"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchCategories,
  type SerializedCategory,
} from "@/lib/categories/category-client";

async function loadCategories() {
  const { response, data } = await fetchCategories();

  if (!data || !response.ok || !data.ok) {
    return {
      categories: [] as SerializedCategory[],
      error: "Could not load categories.",
    };
  }

  return {
    categories: data.categories,
    error: "",
  };
}

export function useCategories() {
  const [categories, setCategories] = useState<SerializedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await loadCategories();
      setCategories(result.categories);
      setError(result.error);
    } catch {
      setCategories([]);
      setError("Could not load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await loadCategories();
        if (cancelled) {
          return;
        }

        setCategories(result.categories);
        setError(result.error);
      } catch {
        if (!cancelled) {
          setCategories([]);
          setError("Could not load categories.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    categories,
    loading,
    error,
    refresh,
    setCategories,
  };
}
