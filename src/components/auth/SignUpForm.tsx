"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { readAuthJson } from "@/lib/auth/client";
import {
  REGISTER_SERVER_ERROR,
  validateSignUp,
  type FieldErrors,
  type SignUpValues,
} from "@/lib/auth-validation";
import { routes } from "@/lib/routes";

import { AuthAlert } from "./AuthAlert";
import { AuthField } from "./AuthField";
import { AuthSubmit } from "./AuthSubmit";

const emptyValues: SignUpValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

type RegisterResponse =
  | { ok: true; user: { id: string; name: string | null; email: string } }
  | { ok: false; errors?: FieldErrors<SignUpValues>; message?: string };

export function SignUpForm() {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [values, setValues] = useState<SignUpValues>(emptyValues);
  const [errors, setErrors] = useState<FieldErrors<SignUpValues>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function update<K extends keyof SignUpValues>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || submittingRef.current) {
      return;
    }

    const nextErrors = validateSignUp(values);
    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await readAuthJson<RegisterResponse>(response);

      if (!data) {
        setFormError(REGISTER_SERVER_ERROR);
        return;
      }

      if (!response.ok || !data.ok) {
        if ("errors" in data && data.errors) {
          setErrors(data.errors);
        }
        if ("message" in data && data.message) {
          setFormError(data.message);
        } else if (!("errors" in data && data.errors)) {
          setFormError(REGISTER_SERVER_ERROR);
        }
        return;
      }

      router.push(routes.signIn);
      router.refresh();
    } catch {
      setFormError(REGISTER_SERVER_ERROR);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <form
      className="mt-3 flex w-full flex-col gap-2"
      onSubmit={onSubmit}
      noValidate
      aria-busy={loading}
    >
      <AuthField
        id="sign-up-name"
        label="Name"
        name="name"
        autoComplete="name"
        value={values.name}
        onChange={(event) => update("name", event.target.value)}
        error={errors.name}
        disabled={loading}
      />
      <AuthField
        id="sign-up-email"
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
        id="sign-up-password"
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        value={values.password}
        onChange={(event) => update("password", event.target.value)}
        error={errors.password}
        placeholder="At least 8 characters"
        disabled={loading}
      />
      <AuthField
        id="sign-up-confirm"
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={(event) => update("confirmPassword", event.target.value)}
        error={errors.confirmPassword}
        disabled={loading}
      />
      {formError ? <AuthAlert message={formError} /> : null}
      <AuthSubmit
        label="Create My Vault"
        loadingLabel="Creating…"
        loading={loading}
      />
      <p className="mt-1 text-center text-[0.8rem] text-white/42">
        Already have a vault?{" "}
        <Link
          href={routes.signIn}
          className="text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
