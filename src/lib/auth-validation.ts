export type SignUpValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type SignUpPayload = {
  name: string;
  email: string;
  password: string;
};

export type SignInPayload = {
  email: string;
  password: string;
};

export type SignInValues = {
  email: string;
  password: string;
};

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return emailPattern.test(value.trim());
}

export function validateSignUp(values: SignUpValues): FieldErrors<SignUpValues> {
  const errors: FieldErrors<SignUpValues> = {};
  const name = values.name.trim();
  const email = values.email.trim();

  if (!name) {
    errors.name = "Enter your name.";
  } else if (name.length < 2) {
    errors.name = "Name needs at least 2 characters.";
  }

  if (!email) {
    errors.email = "Enter your email.";
  } else if (!isValidEmail(email)) {
    errors.email = "Enter a valid email.";
  }

  if (!values.password) {
    errors.password = "Create a password.";
  } else if (values.password.length < 8) {
    errors.password = "Password needs at least 8 characters.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseSignUpBody(body: unknown):
  | { success: true; data: SignUpPayload }
  | { success: false; errors: FieldErrors<SignUpValues> } {
  if (!isRecord(body)) {
    return {
      success: false,
      errors: { email: "Invalid request." },
    };
  }

  const values: SignUpValues = {
    name: typeof body.name === "string" ? body.name : "",
    email: typeof body.email === "string" ? body.email : "",
    password: typeof body.password === "string" ? body.password : "",
    confirmPassword:
      typeof body.confirmPassword === "string" ? body.confirmPassword : "",
  };

  const errors = validateSignUp(values);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name: values.name.trim(),
      email: normalizeEmail(values.email),
      password: values.password,
    },
  };
}

export function validateSignIn(values: SignInValues): FieldErrors<SignInValues> {
  const errors: FieldErrors<SignInValues> = {};
  const email = values.email.trim();

  if (!email) {
    errors.email = "Enter your email.";
  } else if (!isValidEmail(email)) {
    errors.email = "Enter a valid email.";
  }

  if (!values.password) {
    errors.password = "Enter your password.";
  }

  return errors;
}

export function parseSignInBody(body: unknown):
  | { success: true; data: SignInPayload }
  | { success: false; errors: FieldErrors<SignInValues> } {
  if (!isRecord(body)) {
    return {
      success: false,
      errors: { email: "Invalid request." },
    };
  }

  const values: SignInValues = {
    email: typeof body.email === "string" ? body.email : "",
    password: typeof body.password === "string" ? body.password : "",
  };

  const errors = validateSignIn(values);
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      email: normalizeEmail(values.email),
      password: values.password,
    },
  };
}

export const AUTH_UNAVAILABLE =
  "Authentication is not connected yet. Your details were not saved.";

export const REGISTER_DUPLICATE_EMAIL =
  "An account with this email already exists.";

export const REGISTER_SERVER_ERROR =
  "Something went wrong. Please try again.";

export const LOGIN_INVALID_CREDENTIALS = "Invalid email or password.";

export const LOGIN_SERVER_ERROR = "Something went wrong. Please try again.";
