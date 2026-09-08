export const categorySelect = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      notes: true,
    },
  },
} as const;

type CategoryRecord = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    notes: number;
  };
};

export type SerializedCategory = {
  id: string;
  name: string;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
};

export function serializeCategory(category: CategoryRecord): SerializedCategory {
  return {
    id: category.id,
    name: category.name,
    noteCount: category._count.notes,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}
