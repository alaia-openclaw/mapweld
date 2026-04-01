import { NextResponse } from "next/server";
import { sendContactEmails } from "@/lib/email";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const topic = typeof body?.topic === "string" ? body.topic.trim() : "";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Message is required." },
        { status: 400 },
      );
    }

    await sendContactEmails({ name, email, message, topic });
    return NextResponse.json({ ok: true });
  } catch (error) {
    // eslint-disable-next-line no-console -- helpful for contact delivery failures
    console.error("[contact] Failed to send contact emails", error);
    return NextResponse.json(
      { ok: false, error: "We could not send your message right now. Please try again shortly." },
      { status: 500 },
    );
  }
}
