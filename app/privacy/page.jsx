import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description:
    "MapWeld privacy policy — how your data is handled, stored, and protected.",
  alternates: { canonical: "https://www.mapweld.app/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <main className="flex-1 px-4 py-16 md:py-24">
        <article className="max-w-2xl mx-auto prose prose-base">
          <h1 className="text-3xl md:text-4xl font-extrabold text-base-content tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-base-content/60">
            Last updated: March 2026
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Overview
          </h2>
          <p>
            MapWeld (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;)
            is a browser-based weld-tracking tool available at{" "}
            <a
              href="https://www.mapweld.app"
              className="link link-primary"
            >
              www.mapweld.app
            </a>
            . Your privacy matters to us.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Data we collect
          </h2>
          <p>
            <strong>We do not collect personal data.</strong> MapWeld runs
            entirely in your browser. Drawings, weld data, and project files
            are stored locally on your device using your browser&apos;s
            IndexedDB storage. Nothing is uploaded to our servers.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Cookies
          </h2>
          <p>
            MapWeld does not use tracking cookies or analytics cookies. The
            only storage used is IndexedDB for saving your project data
            locally, and the service worker cache for offline support.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Third-party services
          </h2>
          <p>
            MapWeld does not integrate with third-party analytics, advertising,
            or tracking services. The site is hosted on standard web
            infrastructure which may log basic server access data (IP address,
            request timestamp) as part of normal operations.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Data retention
          </h2>
          <p>
            Your project data remains in your browser until you clear it. We
            have no access to it and cannot recover it if you delete it.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Children&apos;s privacy
          </h2>
          <p>
            MapWeld is not directed at children under 13. We do not knowingly
            collect data from children.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Changes to this policy
          </h2>
          <p>
            We may update this policy from time to time. Changes will be
            posted on this page with an updated date.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Contact
          </h2>
          <p>
            Questions about this policy? Reach out at{" "}
            <a
              href="mailto:contact@mapweld.app"
              className="link link-primary"
            >
              contact@mapweld.app
            </a>{" "}
            or visit our{" "}
            <Link href="/contact" className="link link-primary">
              contact page
            </Link>
            .
          </p>

          <div className="mt-12 pt-6 border-t border-base-300">
            <Link href="/" className="link link-primary text-sm">
              &larr; Back to home
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
