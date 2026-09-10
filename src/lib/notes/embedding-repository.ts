import { NoteType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

/**
 * All vector I/O for note_embeddings lives here. Prisma has no native
 * vector scalar (the column is `Unsupported("vector(768)")` in the
 * schema), so every read/write of the `embedding` column itself has to go
 * through raw SQL — this is the one place in the app that does that.
 *
 * Safety: every raw query below uses Prisma's tagged-template
 * `$queryRaw`/`$executeRaw`, which binds each `${...}` as a parameter —
 * never string concatenation. User-supplied search text is only ever
 * embedded (turned into numbers by Gemini) before it reaches SQL; the
 * numbers are what get interpolated, not the original text.
 */

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function upsertNoteEmbedding(
  noteId: string,
  embedding: number[],
  model: string,
  dimensions: number,
): Promise<void> {
  const vectorLiteral = toVectorLiteral(embedding);
  // Only used on first insert; ON CONFLICT keeps the existing row's id.
  // Generated in JS (not gen_random_uuid()) to avoid depending on which
  // Postgres version/extensions provide that function.
  const id = crypto.randomUUID();

  await prisma.$executeRaw`
    INSERT INTO note_embeddings (id, note_id, embedding, model, dimensions, created_at, updated_at)
    VALUES (${id}, ${noteId}, ${vectorLiteral}::vector, ${model}, ${dimensions}, now(), now())
    ON CONFLICT (note_id)
    DO UPDATE SET
      embedding = EXCLUDED.embedding,
      model = EXCLUDED.model,
      dimensions = EXCLUDED.dimensions,
      updated_at = now()
  `;
}

/**
 * Note ids for a user that have no embedding row yet, or whose embedding
 * was made by a different model/dimension than the one currently
 * configured (e.g. after a deliberate model upgrade). Used by the
 * backfill script; scoped to one user at a time to keep it simple to
 * reason about and re-run.
 */
export async function findNoteIdsNeedingEmbedding(
  userId: string,
  currentModel: string,
  currentDimensions: number,
): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT n.id
    FROM notes n
    LEFT JOIN note_embeddings ne ON ne.note_id = n.id
    WHERE n.user_id = ${userId}
      AND (
        ne.note_id IS NULL
        OR ne.model <> ${currentModel}
        OR ne.dimensions <> ${currentDimensions}
      )
    ORDER BY n.created_at ASC
  `;

  return rows.map((row) => row.id);
}

export type SemanticSearchRow = {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  sourceUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  createdAt: Date;
  updatedAt: Date;
  similarity: number;
};

/**
 * Cosine similarity search, scoped to one user. `<=>` is pgvector's
 * cosine *distance* operator (0 = identical direction, 2 = opposite), so
 * `1 - distance` converts it to the more intuitive "higher is more
 * similar" cosine *similarity* used elsewhere in this codebase.
 *
 * userId is always the second thing in the WHERE clause (after the join),
 * never something the caller can omit — see semanticSearchNotes below,
 * the only exported entry point, which requires it as a parameter.
 */
export async function searchNotesBySimilarity(
  userId: string,
  queryEmbedding: number[],
  topK: number,
): Promise<SemanticSearchRow[]> {
  const vectorLiteral = toVectorLiteral(queryEmbedding);

  return prisma.$queryRaw<SemanticSearchRow[]>`
    SELECT
      n.id AS id,
      n.title AS title,
      n.content AS content,
      n.type AS type,
      n.source_url AS "sourceUrl",
      n.category_id AS "categoryId",
      c.name AS "categoryName",
      n.created_at AS "createdAt",
      n.updated_at AS "updatedAt",
      1 - (ne.embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM note_embeddings ne
    JOIN notes n ON n.id = ne.note_id
    LEFT JOIN categories c ON c.id = n.category_id
    WHERE n.user_id = ${userId}
    ORDER BY ne.embedding <=> ${vectorLiteral}::vector ASC
    LIMIT ${topK}
  `;
}
