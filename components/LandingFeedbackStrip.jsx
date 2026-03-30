"use client";

import { useState, useMemo } from "react";
import { track } from "@vercel/analytics";

const TOPICS = [
  { id: "feature", label: "Missing feature", subject: "MapWeld feedback — Missing feature" },
  { id: "pilot", label: "Pilot interest", subject: "MapWeld feedback — Pilot interest" },
];

export default function LandingFeedbackStrip() {
  const [topicId, setTopicId] = useState("feature");
  const [note, setNote] = useState("");

  const mailtoHref = useMemo(() => {
    const topic = TOPICS.find((t) => t.id === topicId) ?? TOPICS[0];
    const body = [note.trim() || "Hello MapWeld,", "", `Topic: ${topic.label}`].join("\n");
    return `mailto:hello@mapweld.app?subject=${encodeURIComponent(topic.subject)}&body=${encodeURIComponent(body)}`;
  }, [topicId, note]);

  function handleSubmit(e) {
    e.preventDefault();
    track("landing_feedback_submit", { topic: topicId });
    window.location.href = mailtoHref;
  }

  return (
    <div className="rounded-3xl border border-base-300 bg-base-200/50 p-6 md:p-8 shadow-sm">
      <h3 className="text-xl font-bold text-base-content">One-minute feedback</h3>
      <p className="mt-2 text-sm text-base-content/65 leading-relaxed max-w-2xl">
        Tell us what matters in one line. Your email app will open with a prefilled subject so we can sort replies quickly.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-2">Topic</p>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTopicId(id)}
                className={`btn btn-sm rounded-full border ${
                  topicId === id
                    ? "btn-primary border-primary"
                    : "btn-ghost border-base-300 bg-base-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-control">
          <label className="label pt-0" htmlFor="landing-feedback-note">
            <span className="label-text font-medium">Message (optional)</span>
          </label>
          <textarea
            id="landing-feedback-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="textarea textarea-bordered w-full text-base"
            placeholder="A sentence or two is enough."
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Send feedback
        </button>
      </form>
    </div>
  );
}
