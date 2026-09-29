export const tagSelect = {
  id: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      noteTags: true,
    },
  },
} as const;

type TagRecord = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    noteTags: number;
  };
};

export type SerializedTag = {
  id: string;
  name: string;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
};

export function serializeTag(tag: TagRecord): SerializedTag {
  return {
    id: tag.id,
    name: tag.name,
    noteCount: tag._count.noteTags,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
  };
}
