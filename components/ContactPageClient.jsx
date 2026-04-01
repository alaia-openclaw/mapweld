"use client";

import Link from "next/link";
import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";

const TOPIC_COPY = {
  pilot: {
    hint: "You’re contacting us about a pilot or evaluation on a real project.",
    defaultSubject: "MapWeld — Pilot / evaluation",
  },
  roadmap: {
    hint: "You’re contacting us about product direction, roadmap, or feature priorities.",
    defaultSubject: "MapWeld — Product direction & roadmap",
  },
  support: {
    hint: "You’re contacting us for help using MapWeld.",
    defaultSubject: "MapWeld — Support request",
  },
  feedback: {
    hint: "You’re contacting us with general feedback.",
    defaultSubject: "MapWeld — Feedback",
  },
};

export default function ContactPageClient({ topic: topicParam }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const topicKey = topicParam && TOPIC_COPY[topicParam] ? topicParam : null;
  const topicMeta = topicKey ? TOPIC_COPY[topicKey] : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitted(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          topic: topicMeta?.defaultSubject ?? "General enquiry",
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubmitError(payload?.error || "Could not send your message. Please try again.");
        return;
      }

      setIsSubmitted(true);
      setForm({ name: "", email: "", message: "" });
    } catch {
      setSubmitError("Network error while sending. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <main className="flex-1 px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto space-y-10">
          <div className="space-y-4 text-center md:text-left">
            <BrandLogo href="/" className="justify-center md:justify-start" />
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-base-content tracking-tight">
                Contact
              </h1>
              <p className="mt-3 text-base-content/70 leading-relaxed">
                For general enquiries, support, or feedback, get in touch using the email below or the form.
              </p>
            </div>
          </div>

          <section className="rounded-3xl border border-base-300 bg-base-100 p-6 md:p-8 shadow-sm space-y-8">
            {topicMeta ? (
              <div
                role="status"
                className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-base-content/80 leading-relaxed"
              >
                {topicMeta.hint}
              </div>
            ) : null}

            <div className="space-y-3">
              <p className="text-sm font-semibold text-base-content/80 uppercase tracking-wide">
                Email us directly
              </p>
              <p className="text-base-content/70 text-sm leading-relaxed">
                <a href="mailto:hello@mapweld.app" className="link link-primary text-base font-semibold break-all">
                  hello@mapweld.app
                </a>
              </p>
            </div>

            <div className="border-t border-base-300 pt-8 space-y-4">
              <h2 className="text-lg font-bold text-base-content">Send a message</h2>
              <p className="text-base-content/70 text-sm leading-relaxed">
                Fill in the fields and send. We will receive your message at hello@mapweld.app.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
                    <span className="label-text font-medium">Your email</span>
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
                    placeholder="How can we help?"
                  />
                </div>

                {submitError ? (
                  <p className="text-sm text-error" role="alert">
                    {submitError}
                  </p>
                ) : null}
                {isSubmitted ? (
                  <p className="text-sm text-success" role="status">
                    Message sent. We also emailed you a confirmation.
                  </p>
                ) : null}

                <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send message"}
                </button>
              </form>
            </div>
          </section>

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
