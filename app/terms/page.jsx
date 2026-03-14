import Link from "next/link";

export const metadata = {
  title: "Terms of Use",
  description:
    "MapWeld terms of use — conditions for using the weld-tracking application.",
  alternates: { canonical: "https://www.mapweld.app/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <main className="flex-1 px-4 py-16 md:py-24">
        <article className="max-w-2xl mx-auto prose prose-base">
          <h1 className="text-3xl md:text-4xl font-extrabold text-base-content tracking-tight">
            Terms of Use
          </h1>
          <p className="text-sm text-base-content/60">
            Last updated: March 2026
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Acceptance of terms
          </h2>
          <p>
            By accessing or using MapWeld (
            <a
              href="https://www.mapweld.app"
              className="link link-primary"
            >
              www.mapweld.app
            </a>
            ), you agree to these Terms of Use. If you do not agree, please
            do not use the service.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Description of service
          </h2>
          <p>
            MapWeld is a free, browser-based tool for tracking welds on PDF
            drawings. It allows you to upload drawings, place weld markers,
            record statuses and notes, and export data to Excel. The
            application runs locally in your browser.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            No warranty
          </h2>
          <p>
            MapWeld is provided <strong>&ldquo;as is&rdquo;</strong> and{" "}
            <strong>&ldquo;as available&rdquo;</strong> without warranties of
            any kind, express or implied. We do not guarantee that the
            service will be uninterrupted, error-free, or that data will not
            be lost. You use MapWeld at your own risk.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Your data
          </h2>
          <p>
            All data you create in MapWeld (drawings, weld records, project
            files) is stored locally in your browser. We do not have access
            to your data and are not responsible for its backup, loss, or
            corruption. You are responsible for saving and backing up your
            own work.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Acceptable use
          </h2>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 text-base-content/80">
            <li>Use MapWeld for any unlawful purpose</li>
            <li>
              Attempt to interfere with or disrupt the service or its
              infrastructure
            </li>
            <li>
              Reverse-engineer, decompile, or disassemble any part of the
              application
            </li>
            <li>
              Redistribute or resell the service without prior written
              consent
            </li>
          </ul>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Intellectual property
          </h2>
          <p>
            The MapWeld name, logo, design, and code are the property of
            their respective owners. You retain full ownership of any data
            or documents you upload or create using MapWeld.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Limitation of liability
          </h2>
          <p>
            To the fullest extent permitted by law, MapWeld and its
            operators shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages arising from your
            use of the service, including but not limited to loss of data,
            revenue, or profits.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Changes to these terms
          </h2>
          <p>
            We may update these terms from time to time. Continued use of
            MapWeld after changes are posted constitutes acceptance of the
            updated terms.
          </p>

          <h2 className="text-xl font-bold text-base-content mt-8">
            Contact
          </h2>
          <p>
            Questions about these terms? Reach out at{" "}
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
