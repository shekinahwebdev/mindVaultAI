import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

// Used only to normalize bcrypt timing when an email is not found.
const DUMMY_PASSWORD_HASH =
  "$2b$12$9ENc3p64ZaAdTOtD3ioDlevRITrbZYlKhAzFjadnzce0iqLbA06yO";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function verifyPasswordWithTimingGuard(
  password: string,
  hash: string | null | undefined,
) {
  return bcrypt.compare(password, hash ?? DUMMY_PASSWORD_HASH);
}
