import {
  MAX_CATEGORY_NAME_LENGTH,
  normalizeCategoryName,
  validateCategoryName,
} from "@/lib/category-validation";

export { MAX_CATEGORY_NAME_LENGTH, normalizeCategoryName, validateCategoryName };

export type CategoryNameFieldErrors = {
  name?: string;
};

export function validateCategoryNameField(name: string): CategoryNameFieldErrors {
  const error = validateCategoryName(name);
  return error ? { name: error } : {};
}
