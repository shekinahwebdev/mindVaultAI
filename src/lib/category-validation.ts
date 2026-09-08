export const MAX_CATEGORY_NAME_LENGTH = 80;

export const CATEGORY_NOT_FOUND = "Category not found.";
export const CATEGORY_SERVER_ERROR = "Something went wrong. Please try again.";
export const CATEGORY_DUPLICATE_NAME =
  "You already have a category with this name.";

export type CategoryNameValues = {
  name: string;
};

export type CategoryFieldErrors<T> = Partial<Record<keyof T, string>>;

export function normalizeCategoryName(name: string) {
  return name.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateCategoryName(name: string): string | undefined {
  const trimmed = normalizeCategoryName(name);

  if (!trimmed) {
    return "Category name is required.";
  }

  if (trimmed.length > MAX_CATEGORY_NAME_LENGTH) {
    return `Category name must be at most ${MAX_CATEGORY_NAME_LENGTH} characters.`;
  }

  return undefined;
}

export function parseCreateCategoryBody(body: unknown):
  | { success: true; data: { name: string } }
  | { success: false; errors: CategoryFieldErrors<CategoryNameValues> } {
  if (!isRecord(body)) {
    return {
      success: false,
      errors: { name: "Invalid request." },
    };
  }

  const rawName = typeof body.name === "string" ? body.name : "";
  const nameError = validateCategoryName(rawName);

  if (nameError) {
    return {
      success: false,
      errors: { name: nameError },
    };
  }

  return {
    success: true,
    data: { name: normalizeCategoryName(rawName) },
  };
}

export function parseUpdateCategoryBody(body: unknown):
  | { success: true; data: { name: string } }
  | { success: false; errors: CategoryFieldErrors<CategoryNameValues> } {
  if (!isRecord(body)) {
    return {
      success: false,
      errors: { name: "Invalid request." },
    };
  }

  const forbiddenFields = ["userId", "id", "createdAt", "updatedAt"] as const;
  for (const field of forbiddenFields) {
    if (field in body) {
      return {
        success: false,
        errors: { name: "Invalid request." },
      };
    }
  }

  if (!("name" in body)) {
    return {
      success: false,
      errors: { name: "Category name is required." },
    };
  }

  const rawName = typeof body.name === "string" ? body.name : "";
  const nameError = validateCategoryName(rawName);

  if (nameError) {
    return {
      success: false,
      errors: { name: nameError },
    };
  }

  return {
    success: true,
    data: { name: normalizeCategoryName(rawName) },
  };
}
