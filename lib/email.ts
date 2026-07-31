// Sends via real SMTP (Gmail by default) using worker-mailer, which speaks
// SMTP directly over Cloudflare's `cloudflare:sockets` TCP API -- the only
// way to do actual SMTP from this app, since it runs on the Edge Runtime
// (no Node `net`/`tls`, so nodemailer doesn't work here). Requires the
// `cloudflare:*` externals patch in next.config.ts, otherwise Next's
// webpack build fails outright on the `cloudflare:sockets` import.
//
// Note: `cloudflare:sockets` only exists in the real Workers runtime.
// worker-mailer is imported dynamically inside sendEmail() rather than at
// the top of this file -- a static import evaluates `cloudflare:sockets`
// as soon as anything imports this module (e.g. just rendering a page that
// pulls in an action that imports this file), which crashes plain
// `npm run dev` (Node) even when no email is ever sent. Test actual sending
// with `npm run preview` (wrangler pages dev) instead.

export interface EmailAttachment {
  filename: string;
  /** Raw (non-base64) string content -- base64-encoded before sending. */
  content: string;
  contentType: string;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}): Promise<void> {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? 587);
  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const fromName = process.env.SMTP_FROM_NAME;
  if (!username || !password) {
    throw new Error("Email sending isn't configured yet (missing SMTP_USER / SMTP_PASSWORD).");
  }

  const { WorkerMailer } = await import("worker-mailer");
  await WorkerMailer.send(
    {
      host,
      port,
      secure: port === 465,
      startTls: port !== 465,
      credentials: { username, password },
      authType: ["login", "plain"],
    },
    {
      from: fromName ? { name: fromName, email: username } : username,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      attachments: params.attachments?.map((a) => ({
        filename: a.filename,
        content: btoa(a.content),
        mimeType: a.contentType,
      })),
    }
  );
}
