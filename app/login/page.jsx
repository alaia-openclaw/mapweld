import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

function LoginFormFallback() {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <span className="loading loading-lg loading-spinner text-primary" aria-label="Loading" />
    </div>
  );
}

export default function LoginPage() {
  const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm googleEnabled={googleEnabled} />
    </Suspense>
  );
}
