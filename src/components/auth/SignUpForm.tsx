"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
import { cn } from "@/lib/utils";

import { AuthAlert } from "./AuthAlert";
import { AuthField } from "./AuthField";
import { AuthFormDivider } from "./AuthFormDivider";
import { AuthSignUpSocialButtons } from "./AuthSignUpSocialButtons";
import { authFieldSignUpClassName, authSubmitSplitClassName } from "./auth-ui";

const emptyValues: SignUpValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

type RegisterResponse =
  | { ok: true; user: { id: string; name: string | null; email: string } }
  | { ok: false; errors?: FieldErrors<SignUpValues>; message?: string };

const fieldLabelClass =
  "text-[0.75rem] font-normal normal-case tracking-normal text-white/45";

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

    const payload: SignUpValues = {
      ...values,
      confirmPassword: values.password,
    };

    const nextErrors = validateSignUp(payload);
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
        body: JSON.stringify(payload),
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
      className="mt-5 flex w-full flex-col gap-3.5"
      onSubmit={onSubmit}
      noValidate
      aria-busy={loading}
    >
      <AuthSignUpSocialButtons />
      <AuthFormDivider />

      <AuthField
        id="sign-up-name"
        label="Full name"
        name="name"
        autoComplete="name"
        value={values.name}
        onChange={(event) => update("name", event.target.value)}
        error={errors.name}
        disabled={loading}
        inputClassName={authFieldSignUpClassName}
        labelClassName={fieldLabelClass}
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
        inputClassName={authFieldSignUpClassName}
        labelClassName={fieldLabelClass}
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
        inputClassName={authFieldSignUpClassName}
        labelClassName={fieldLabelClass}
      />
      {formError ? <AuthAlert message={formError} /> : null}
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className={cn(authSubmitSplitClassName, "mt-1 min-h-12")}
      >
        {loading ? "Creating…" : "Create account"}
        {!loading ? <ArrowRight aria-hidden className="size-4" /> : null}
      </button>
      <p className="text-[0.75rem] leading-relaxed text-white/36">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
      <p className="text-center text-[0.8125rem] text-white/42">
        Already have an account?{" "}
        <Link
          href={routes.signIn}
          className="font-semibold text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
