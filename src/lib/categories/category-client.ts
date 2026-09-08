import { readAuthJson } from "@/lib/auth/client";

export type SerializedCategory = {
  id: string;
  name: string;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ListCategoriesResponse =
  | { ok: true; categories: SerializedCategory[] }
  | { ok: false; message?: string };

export type CategoryMutationResponse =
  | { ok: true; category: SerializedCategory }
  | {
      ok: false;
      errors?: { name?: string };
      message?: string;
    };

export type DeleteCategoryResponse =
  | { ok: true; affectedNotes: number }
  | { ok: false; message?: string };

export const CATEGORY_ADDED_MESSAGE = "Category added to your vault.";
export const CATEGORY_RENAMED_MESSAGE = "Category renamed.";
export const CATEGORY_DELETED_MESSAGE = "Category deleted.";
export const CATEGORY_LOAD_ERROR =
  "Could not load categories. You can still save as uncategorized.";
export const CATEGORY_CLIENT_ERROR =
  "Something went wrong. Please try again.";

export async function fetchCategories() {
  const response = await fetch("/api/categories");
  const data = await readAuthJson<ListCategoriesResponse>(response);
  return { response, data };
}

export async function createCategory(name: string) {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const data = await readAuthJson<CategoryMutationResponse>(response);
  return { response, data };
}

export async function renameCategory(id: string, name: string) {
  const response = await fetch(`/api/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const data = await readAuthJson<CategoryMutationResponse>(response);
  return { response, data };
}

export async function deleteCategory(id: string) {
  const response = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
  });

  const data = await readAuthJson<DeleteCategoryResponse>(response);
  return { response, data };
}
