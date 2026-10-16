import type { Collection } from "@/generated/prisma/client";

export type SerializedCollection = {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export function serializeCollection(
  row: Collection,
  itemCount: number,
): SerializedCollection {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    itemCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
