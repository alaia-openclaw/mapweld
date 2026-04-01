import { Resend } from "resend";

const DEFAULT_WELCOME_FROM = "MapWeld <hello@mapweld.app>";
const DEFAULT_VERIFICATION_FROM = "MapWeld <noreply@resend.mapweld.app>";
const DEFAULT_CONTACT_FROM = "MapWeld <hello@mapweld.app>";

function getAuthBaseUrl() {
  return (
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

function emailShell({ title, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f4f5;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:8px;border:1px solid #e4e4e7;padding:28px 24px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:18px;font-weight:600;">${title}</p>
          <div style="font-size:15px;line-height:1.55;color:#3f3f46;">${bodyHtml}</div>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#71717a;">MapWeld</p>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * @param {{ to: string; name?: string; token: string }} params
 */
export async function sendVerificationEmail({ to, name, token }) {
  const key = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM_VERIFICATION ?? process.env.EMAIL_FROM ?? DEFAULT_VERIFICATION_FROM;
  if (!key) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console -- intentional dev hint
      console.info("[email] Skipping verification email: set RESEND_API_KEY");
    }
    return;
  }

  const base = getAuthBaseUrl();
  const verifyUrl = `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const resend = new Resend(key);
  await resend.emails.send({
    from,
    to,
    subject: "Confirm your email to get started with MapWeld",
    html: emailShell({
      title: "One step to go",
      bodyHtml: `<p style="margin:0 0 16px;">One quick step before you can export your weld register.</p>
<p style="margin:0 0 24px;">Click the button below to verify your email and activate your account.</p>
<p style="margin:0 0 28px;"><a href="${verifyUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:15px;font-weight:700;letter-spacing:0.01em;">Verify my email →</a></p>
<p style="margin:0 0 12px;font-size:13px;color:#52525b;">The core app is <strong>free to use without an account</strong> — you only need to sign in to export your weld register (Excel &amp; PDF).</p>
<p style="margin:0 0 20px;font-size:13px;color:#71717a;">This link expires in 24 hours. If you didn't create a MapWeld account, you can safely ignore this email.</p>
<p style="margin:0;font-size:13px;color:#71717a;">— The MapWeld team<br/><a href="https://mapweld.com" style="color:#1e3a5f;">mapweld.com</a></p>
<hr style="margin:20px 0;border:none;border-top:1px solid #e4e4e7;"/>
<p style="margin:0;font-size:12px;color:#a1a1aa;">If the button doesn't work, paste this link into your browser:<br/><span style="word-break:break-all;">${verifyUrl}</span></p>`,
    }),
  });
}

/**
 * @param {{ to: string; name?: string }} params
 */
export async function sendWelcomeEmail({ to, name }) {
  const key = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM_WELCOME ?? process.env.EMAIL_FROM ?? DEFAULT_WELCOME_FROM;
  if (!key) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console -- intentional dev hint
      console.info("[email] Skipping welcome email: set RESEND_API_KEY (and EMAIL_FROM_WELCOME if overriding sender)");
    }
    return;
  }

  const resend = new Resend(key);
  const firstName = name ? name.split(" ")[0] : null;
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  await resend.emails.send({
    from,
    to,
    subject: "You're in — welcome to MapWeld 👷",
    html: emailShell({
      title: "Welcome to MapWeld 👷",
      bodyHtml: `<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 16px;">You're in. MapWeld lets you <strong>track welds on the drawing and export the register instantly</strong> — no spreadsheet wrangling required.</p>
<p style="margin:0 0 8px;"><strong>Ready to get started?</strong></p>
<ol style="margin:0 0 20px;padding-left:20px;">
  <li style="margin-bottom:6px;">Open a PDF drawing in MapWeld</li>
  <li style="margin-bottom:6px;">Place your first weld marker on the drawing</li>
  <li>Your weld register builds itself as you go ✓</li>
</ol>
<p style="margin:0 0 24px;"><a href="https://app.mapweld.com" style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:15px;font-weight:700;letter-spacing:0.01em;">Open MapWeld →</a></p>
<p style="margin:0 0 12px;font-size:13px;color:#52525b;">When you're ready to export (PDF or Excel), just sign in — it's free and takes 30 seconds.</p>
<p style="margin:0;font-size:14px;color:#3f3f46;">— Theo<br/><span style="color:#71717a;">Founder, MapWeld · <a href="https://mapweld.com" style="color:#1e3a5f;">mapweld.com</a></span></p>`,
    }),
  });
}

/**
 * @param {{ name?: string; email: string; message: string; topic?: string }} params
 */
export async function sendContactEmails({ name, email, message, topic }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM_CONTACT ?? DEFAULT_CONTACT_FROM;
  if (!key) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const resend = new Resend(key);
  const trimmedName = name?.trim() || "Unknown";
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();
  const trimmedTopic = topic?.trim() || "General";

  await resend.emails.send({
    from,
    to: "hello@mapweld.app",
    replyTo: trimmedEmail,
    subject: `MapWeld contact form — ${trimmedTopic}`,
    html: emailShell({
      title: "New contact message",
      bodyHtml: `<p style="margin:0 0 10px;"><strong>Name:</strong> ${trimmedName}</p>
<p style="margin:0 0 10px;"><strong>Email:</strong> ${trimmedEmail}</p>
<p style="margin:0 0 10px;"><strong>Topic:</strong> ${trimmedTopic}</p>
<p style="margin:0;"><strong>Message:</strong><br/>${trimmedMessage.replace(/\n/g, "<br/>")}</p>`,
    }),
  });

  await resend.emails.send({
    from,
    to: trimmedEmail,
    subject: "We received your message",
    html: emailShell({
      title: "Thanks, we received your message",
      bodyHtml: `<p style="margin:0 0 12px;">Hi ${trimmedName === "Unknown" ? "there" : trimmedName},</p>
<p style="margin:0 0 12px;">Your message was received by the MapWeld team. We will get back to you as soon as possible.</p>
<p style="margin:0;font-size:13px;color:#71717a;">For reference, we received it from: ${trimmedEmail}</p>`,
    }),
  });
}
