"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useCallback, useMemo, useState } from "react";
import { safeAuthCallbackUrl } from "@/lib/auth-callback-url";

const ERROR_MESSAGES = {
  CredentialsSignin: "Invalid email or password.",
  OAuthAccountNotLinked: "This email is linked to another sign-in method.",
  Callback: "Sign-in failed. Try again.",
  Configuration: "Authentication is not configured correctly.",
  AccessDenied: "Access denied.",
  Default: "Sign-in failed. Try again.",
};

function errorMessage(code) {
  if (!code) return null;
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.Default;
}

export default function LoginForm({ googleEnabled }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const callbackUrl = useMemo(
    () => safeAuthCallbackUrl(searchParams.get("callbackUrl") || undefined),
    [searchParams]
  );

  const urlError = errorMessage(searchParams.get("error") || undefined);
  const registered = searchParams.get("registered") === "1";

  const handleCredentials = useCallback(
    async (e) => {
      e.preventDefault();
      setFormError("");
      setSubmitting(true);
      try {
        const res = await signIn("credentials", {
          email: email.trim(),
          password,
          redirect: false,
          callbackUrl,
        });
        if (res?.error) {
          setFormError(ERROR_MESSAGES.CredentialsSignin);
          setSubmitting(false);
          return;
        }
        router.push(callbackUrl);
        router.refresh();
      } catch {
        setFormError(ERROR_MESSAGES.Default);
        setSubmitting(false);
      }
    },
    [email, password, callbackUrl, router]
  );

  const handleGoogle = useCallback(() => {
    signIn("google", { callbackUrl });
  }, [callbackUrl]);

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300/60">
        <div className="card-body gap-4">
          <div>
            <h1 className="text-2xl font-bold">Sign in</h1>
            <p className="text-sm text-base-content/70 mt-1">MapWeld — access export and your account</p>
          </div>

          {registered ? (
            <div className="alert alert-success text-sm py-2">Account created. Sign in below.</div>
          ) : null}
          {urlError ? (
            <div className="alert alert-error text-sm py-2" role="alert">
              {urlError}
            </div>
          ) : null}
          {formError ? (
            <div className="alert alert-error text-sm py-2" role="alert">
              {formError}
            </div>
          ) : null}

          <form className="flex flex-col gap-3" onSubmit={handleCredentials}>
            <label className="form-control w-full">
              <span className="label-text text-sm font-medium">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full"
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text text-sm font-medium">Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full"
              />
            </label>
            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting ? <span className="loading loading-spinner loading-sm" /> : "Sign in"}
            </button>
          </form>

          {googleEnabled ? (
            <>
              <div className="divider text-xs text-base-content/50">or</div>
              <button type="button" className="btn btn-outline w-full gap-2" onClick={handleGoogle}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
            </>
          ) : null}

          <p className="text-center text-sm text-base-content/70">
            No account?{" "}
            <Link href="/register" className="link link-primary">
              Create one
            </Link>
          </p>
          <p className="text-center text-sm">
            <Link href="/" className="link link-hover">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
