import { Resend } from "resend";

/**
 * @param {{ to: string; name?: string }} params
 */
export async function sendWelcomeEmail({ to, name }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console -- intentional dev hint
      console.info("[email] Skipping welcome email: set RESEND_API_KEY and EMAIL_FROM");
    }
    return;
  }

  const resend = new Resend(key);
  const greeting = name ? `Hi ${name},` : "Hi,";
  await resend.emails.send({
    from,
    to,
    subject: "Welcome to MapWeld",
    html: `<p>${greeting}</p><p>Thanks for creating a MapWeld account. Sign in anytime to use export and upcoming features.</p><p>— MapWeld</p>`,
  });
}
