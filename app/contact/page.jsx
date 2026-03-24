"use client";

import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <main className="flex-1 px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto space-y-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-base-content tracking-tight">
              Contact
            </h1>
            <p className="mt-3 text-base-content/70 leading-relaxed">
              Have a question, feature request, or bug report? Reach out and
              we&apos;ll get back to you.
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-base-content">Email</h2>
            <p className="text-base-content/80">
              <a
                href="mailto:contact@mapweld.app"
                className="link link-primary"
              >
                contact@mapweld.app
              </a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-base-content">
              Send a message
            </h2>

            {submitted ? (
              <div className="rounded-xl border border-success/30 bg-success/10 p-6 text-center">
                <p className="font-medium text-success">
                  Thanks for your message! We&apos;ll get back to you soon.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm"
              >
                <div className="form-control">
                  <label className="label" htmlFor="contact-name">
                    <span className="label-text font-medium">Name</span>
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    className="input input-bordered input-xs w-full"
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
                    required
                    className="input input-bordered input-xs w-full"
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
                    required
                    rows={5}
                    className="textarea textarea-bordered textarea-xs w-full"
                    placeholder="How can we help?"
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full">
                  Send message
                </button>
              </form>
            )}
          </section>

          <div className="pt-6 border-t border-base-300">
            <Link href="/" className="link link-primary text-sm">
              &larr; Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
