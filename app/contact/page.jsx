"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import BrandLogo from "@/components/BrandLogo";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [copied, setCopied] = useState(false);

  const mailtoHref = useMemo(() => {
    const subject = form.name
      ? `MapWeld enquiry from ${form.name}`
      : "MapWeld enquiry";

    const body = [
      form.message || "Hello MapWeld,",
      "",
      form.name ? `Name: ${form.name}` : null,
      form.email ? `Email: ${form.email}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    return `mailto:contact@mapweld.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [form]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText("contact@mapweld.app");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  function handleSubmit(e) {
    e.preventDefault();
    window.location.href = mailtoHref;
  }

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <main className="flex-1 px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="space-y-4 text-center md:text-left">
            <BrandLogo href="/" className="justify-center md:justify-start" />
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-base-content tracking-tight">
                Contact MapWeld
              </h1>
              <p className="mt-3 text-base-content/70 leading-relaxed max-w-2xl">
                Questions, pilot interest, feature requests, or bug reports —
                send them straight through. No fake ticket form nonsense.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
            <section className="rounded-3xl border border-base-300 bg-base-100 p-6 md:p-8 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-bold text-base-content">Best way to reach us</h2>
                <p className="mt-2 text-base-content/70 leading-relaxed">
                  Email goes directly to the team at:
                </p>
              </div>

              <div className="rounded-2xl border border-base-300 bg-base-200/60 p-4">
                <a
                  href="mailto:contact@mapweld.app"
                  className="text-lg md:text-xl font-bold link link-primary break-all"
                >
                  contact@mapweld.app
                </a>
                <p className="mt-2 text-sm text-base-content/60">
                  Use this for demos, early access, bug reports, and partnership enquiries.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a href="mailto:contact@mapweld.app" className="btn btn-primary">
                  Email MapWeld
                </a>
                <button type="button" onClick={copyEmail} className="btn btn-outline">
                  {copied ? "Copied" : "Copy email"}
                </button>
              </div>

              <div className="rounded-2xl border border-base-300 bg-base-200/40 p-4 text-sm text-base-content/70">
                <p className="font-semibold text-base-content">Why this page is different now</p>
                <p className="mt-2 leading-relaxed">
                  The previous contact form looked real but didn&apos;t actually send anything.
                  This version is honest: it either opens your mail client or lets you copy the address directly.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-base-300 bg-base-100 p-6 md:p-8 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-base-content">Quick message</h2>
                <p className="mt-2 text-base-content/70 leading-relaxed">
                  Fill this in and we&apos;ll open your email app with everything prefilled.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control">
                  <label className="label" htmlFor="contact-name">
                    <span className="label-text font-medium">Name</span>
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input input-bordered w-full"
                    placeholder="Your name"
                  />
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="contact-email">
                    <span className="label-text font-medium">Email</span>
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="input input-bordered w-full"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="contact-message">
                    <span className="label-text font-medium">Message</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={6}
                    required
                    value={form.message}
                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                    className="textarea textarea-bordered w-full"
                    placeholder="Tell us what you're trying to solve, what kind of fabrication work you do, or what feature is missing."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button type="submit" className="btn btn-primary flex-1">
                    Open email draft
                  </button>
                  <a href={mailtoHref} className="btn btn-outline flex-1">
                    Use plain mailto link
                  </a>
                </div>
              </form>
            </section>
          </div>

          <div className="pt-2">
            <Link href="/" className="link link-primary text-sm">
              &larr; Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
