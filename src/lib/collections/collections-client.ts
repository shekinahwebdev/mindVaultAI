import { readAuthJson } from "@/lib/auth/client";

import type { SerializedCollection } from "./collection-serialize";

type CollectionsListResponse =
  | { ok: true; collections: SerializedCollection[] }
  | { ok: false; message?: string };

type CollectionMutationResponse =
  | { ok: true; collection: SerializedCollection }
  | { ok: false; message?: string; errors?: { name?: string } };

export async function fetchCollections() {
  const response = await fetch("/api/collections");
  const data = await readAuthJson<CollectionsListResponse>(response);
  return { response, data };
}

export async function createCollectionRequest(input: {
  name: string;
  description?: string;
}) {
  const response = await fetch("/api/collections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readAuthJson<CollectionMutationResponse>(response);
  return { response, data };
}

export async function updateCollectionRequest(
  id: string,
  input: { name?: string; description?: string | null },
) {
  const response = await fetch(`/api/collections/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readAuthJson<CollectionMutationResponse>(response);
  return { response, data };
}

export async function deleteCollectionRequest(id: string) {
  const response = await fetch(`/api/collections/${id}`, { method: "DELETE" });
  const data = await readAuthJson<{ ok: boolean; message?: string }>(response);
  return { response, data };
}

export async function addCollectionItemRequest(
  collectionId: string,
  kind: "note" | "document",
  itemId: string,
) {
  const response = await fetch(`/api/collections/${collectionId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, itemId }),
  });
  const data = await readAuthJson<{ ok: boolean; message?: string }>(response);
  return { response, data };
}

export async function updateDocumentTagsRequest(documentId: string, tagIds: string[]) {
  const response = await fetch(`/api/documents/${documentId}/tags`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tagIds }),
  });
  const data = await readAuthJson<{ ok: boolean; message?: string; tagIds?: string[] }>(
    response,
  );
  return { response, data };
}
