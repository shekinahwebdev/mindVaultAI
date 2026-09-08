"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { readAuthJson } from "@/lib/auth/client";
import {
  LOGIN_INVALID_CREDENTIALS,
  LOGIN_SERVER_ERROR,
  validateSignIn,
  type FieldErrors,
  type SignInValues,
} from "@/lib/auth-validation";
import { routes } from "@/lib/routes";

import { AuthAlert } from "./AuthAlert";
import { AuthField } from "./AuthField";
import { AuthSubmit } from "./AuthSubmit";

const emptyValues: SignInValues = {
  email: "",
  password: "",
};

type LoginResponse =
  | { ok: true; user: { id: string; email: string; name: string | null } }
  | { ok: false; errors?: FieldErrors<SignInValues>; message?: string };

export function SignInForm() {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [values, setValues] = useState<SignInValues>(emptyValues);
  const [errors, setErrors] = useState<FieldErrors<SignInValues>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function update<K extends keyof SignInValues>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || submittingRef.current) {
      return;
    }

    const nextErrors = validateSignIn(values);
    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await readAuthJson<LoginResponse>(response);

      if (!data) {
        setFormError(LOGIN_SERVER_ERROR);
        return;
      }

      if (!response.ok || !data.ok) {
        if ("errors" in data && data.errors) {
          setErrors(data.errors);
        }

        if (response.status === 401) {
          setValues((current) => ({ ...current, password: "" }));
          setFormError(LOGIN_INVALID_CREDENTIALS);
          return;
        }

        if ("message" in data && data.message) {
          setFormError(data.message);
        } else {
          setFormError(LOGIN_INVALID_CREDENTIALS);
        }
        return;
      }

      router.push(routes.vault);
      router.refresh();
    } catch {
      setFormError(LOGIN_SERVER_ERROR);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <form
      className="mt-4 flex w-full flex-col gap-2.5"
      onSubmit={onSubmit}
      noValidate
      aria-busy={loading}
    >
      <AuthField
        id="sign-in-email"
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={(event) => update("email", event.target.value)}
        error={errors.email}
        disabled={loading}
      />
      <AuthField
        id="sign-in-password"
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={values.password}
        onChange={(event) => update("password", event.target.value)}
        error={errors.password}
        disabled={loading}
      />
      {formError ? <AuthAlert message={formError} /> : null}
      <AuthSubmit
        label="Sign in"
        loadingLabel="Signing in…"
        loading={loading}
      />
      <p className="mt-1 text-center text-[0.8rem] text-white/42">
        New here?{" "}
        <Link
          href={routes.signUp}
          className="text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Create a vault
        </Link>
      </p>
    </form>
  );
}
