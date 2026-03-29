"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useCallback, useState } from "react";

export default function RegisterForm({ googleEnabled }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setSubmitting(true);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Registration failed");
          setSubmitting(false);
          return;
        }
        router.push("/login?registered=1");
        router.refresh();
      } catch {
        setError("Something went wrong. Try again.");
        setSubmitting(false);
      }
    },
    [name, email, password, router]
  );

  const handleGoogle = useCallback(() => {
    signIn("google", { callbackUrl: "/app" });
  }, []);

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300/60">
        <div className="card-body gap-4">
          <div>
            <h1 className="text-2xl font-bold">Create account</h1>
            <p className="text-sm text-base-content/70 mt-1">Register to unlock export on the workspace</p>
          </div>

          {error ? (
            <div className="alert alert-error text-sm py-2" role="alert">
              {error}
            </div>
          ) : null}

          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <label className="form-control w-full">
              <span className="label-text text-sm font-medium">Name (optional)</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input input-bordered w-full"
              />
            </label>
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
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full"
              />
              <span className="label-text-alt text-base-content/60">At least 8 characters</span>
            </label>
            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting ? <span className="loading loading-spinner loading-sm" /> : "Create account"}
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
            Already have an account?{" "}
            <Link href="/login" className="link link-primary">
              Sign in
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
