import { Resend } from "resend";

const DEFAULT_WELCOME_FROM = "MapWeld <hello@mapweld.app>";
const DEFAULT_VERIFICATION_FROM = "MapWeld <noreply@resend.mapweld.app>";

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
  const greeting = name ? `Hi ${name},` : "Hi,";
  const resend = new Resend(key);
  await resend.emails.send({
    from,
    to,
    subject: "Verify your MapWeld email",
    html: emailShell({
      title: "Verify your email",
      bodyHtml: `<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 20px;">Confirm your email to activate your account and sign in.</p>
<p style="margin:0 0 20px;"><a href="${verifyUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;">Verify email</a></p>
<p style="margin:0;font-size:13px;color:#71717a;">If the button does not work, paste this link into your browser:<br/><span style="word-break:break-all;">${verifyUrl}</span></p>`,
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
  const greeting = name ? `Hi ${name},` : "Hi,";
  await resend.emails.send({
    from,
    to,
    subject: "Welcome to MapWeld",
    html: emailShell({
      title: "Welcome to MapWeld",
      bodyHtml: `<p style="margin:0 0 12px;">${greeting}</p>
<p style="margin:0;">Thanks for signing up. You can sign in anytime to use export and upcoming features.</p>`,
    }),
  });
}
