export const MAX_TAG_NAME_LENGTH = 48;

export const TAG_DUPLICATE_MESSAGE =
  "You already have a tag with this name.";
export const TAG_NOT_FOUND_MESSAGE = "Tag not found.";
export const TAG_SERVER_ERROR_MESSAGE =
  "Something went wrong. Please try again.";

export type TagErrorCode =
  | "invalid_input"
  | "duplicate_tag"
  | "tag_not_found"
  | "server_error";

export type TagNameFieldErrors = {
  name?: string;
};
