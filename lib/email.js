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

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Welcome to MapWeld</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header band -->
        <tr>
          <td style="background:#0f172a;padding:28px 32px 24px;">
            <!-- Logo mark: two stacked rectangles + weld dot -->
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="vertical-align:middle;padding-right:12px;">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="32" height="14" rx="3" fill="#1e293b" stroke="#334155" stroke-width="1"/>
                    <rect x="2" y="20" width="32" height="14" rx="3" fill="#1e293b" stroke="#334155" stroke-width="1"/>
                    <!-- pipe line -->
                    <line x1="8" y1="9" x2="28" y2="9" stroke="#22d3ee" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="8" y1="27" x2="28" y2="27" stroke="#22d3ee" stroke-width="1.5" stroke-linecap="round"/>
                    <!-- weld markers -->
                    <circle cx="18" cy="9" r="3.5" fill="#f97316"/>
                    <circle cx="12" cy="27" r="3.5" fill="#f97316"/>
                    <circle cx="24" cy="27" r="3.5" fill="#f97316"/>
                  </svg>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-size:20px;font-weight:700;color:#f1f5f9;letter-spacing:-0.3px;">MapWeld</span>
                </td>
              </tr>
            </table>
            <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;line-height:1.4;">
              Track welds on the drawing. Export the register. Skip the admin.
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 8px;">
            <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.2;">
              You're in. 🎉
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
              ${greeting} Your email is verified and your MapWeld account is live.
            </p>

            <!-- Steps -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="width:28px;vertical-align:top;padding-top:1px;">
                        <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#0f172a;color:#22d3ee;font-size:12px;font-weight:700;text-align:center;line-height:22px;">1</span>
                      </td>
                      <td style="padding-left:10px;font-size:14px;color:#334155;line-height:1.5;">
                        <strong style="color:#0f172a;">Open a PDF drawing</strong><br/>
                        Load any isometric or piping drawing directly in the app
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="width:28px;vertical-align:top;padding-top:1px;">
                        <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#0f172a;color:#22d3ee;font-size:12px;font-weight:700;text-align:center;line-height:22px;">2</span>
                      </td>
                      <td style="padding-left:10px;font-size:14px;color:#334155;line-height:1.5;">
                        <strong style="color:#0f172a;">Drop a weld marker</strong><br/>
                        Tap or click any joint on the drawing to log it
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;">
                  <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="width:28px;vertical-align:top;padding-top:1px;">
                        <span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#0f172a;color:#22d3ee;font-size:12px;font-weight:700;text-align:center;line-height:22px;">3</span>
                      </td>
                      <td style="padding-left:10px;font-size:14px;color:#334155;line-height:1.5;">
                        <strong style="color:#0f172a;">Export your weld register</strong><br/>
                        One click to Excel or PDF — clean, client-ready
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <p style="margin:0 0 28px;text-align:center;">
              <a href="https://app.mapweld.com"
                 style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.01em;">
                Open MapWeld →
              </a>
            </p>

            <!-- Note -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#f8fafc;border-left:3px solid #22d3ee;border-radius:0 6px 6px 0;padding:12px 16px;font-size:13px;color:#475569;line-height:1.5;">
                  The app is <strong>free to use</strong> — sign in unlocks PDF and Excel export, which is also free during early access.
                </td>
              </tr>
            </table>

            <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">
              If you hit any snags or want a quick walkthrough, just reply to this email. I read every one.
            </p>

            <p style="margin:0;font-size:14px;color:#334155;">
              — Theo Regnier<br/>
              <span style="color:#94a3b8;">Founder, MapWeld · <a href="https://mapweld.com" style="color:#0ea5e9;text-decoration:none;">mapweld.com</a></span>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px 24px;border-top:1px solid #f1f5f9;margin-top:16px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
              MapWeld · <a href="https://mapweld.com" style="color:#94a3b8;">mapweld.com</a><br/>
              You're receiving this because you created a MapWeld account.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from,
    to,
    subject: "You're in — welcome to MapWeld 🎉",
    html,
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
