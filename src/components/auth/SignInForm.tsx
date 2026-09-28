"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
import { cn } from "@/lib/utils";

import { AuthAlert } from "./AuthAlert";
import { AuthField } from "./AuthField";
import { AuthOAuthPlaceholder } from "./AuthOAuthPlaceholder";
import { authFieldSplitClassName, authSubmitSignInClassName } from "./auth-ui";

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

  const fieldLabelClass =
    "text-[0.8125rem] font-medium normal-case tracking-normal text-white/55";

  return (
    <form
      className="mt-7 flex w-full flex-col gap-4"
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
        inputClassName={authFieldSplitClassName}
        labelClassName={fieldLabelClass}
      />
      <div>
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
          inputClassName={authFieldSplitClassName}
          labelClassName={fieldLabelClass}
        />
        <div className="mt-2 flex justify-end">
          <span
            className="text-[0.8125rem] text-white/42"
            title="Password reset is not available yet"
          >
            Forgot password?
          </span>
        </div>
      </div>
      {formError ? <AuthAlert message={formError} /> : null}
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className={cn(authSubmitSignInClassName, "mt-1")}
      >
        {loading ? "Signing in…" : "Sign in"}
        {!loading ? <ArrowRight aria-hidden className="size-4" /> : null}
      </button>

      <AuthOAuthPlaceholder />

      <p className="text-center text-[0.8125rem] text-white/42">
        Don&apos;t have an account?{" "}
        <Link
          href={routes.signUp}
          className="font-semibold text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
