// Uses the Resend REST API directly via fetch rather than the `resend` npm
// SDK -- keeps this edge-safe with zero risk of a Node-only dependency
// (same reasoning as lib/qr.ts and the earlier qrcode lesson) and avoids
// adding a dependency for what's a single HTTP call.
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
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("Email sending isn't configured yet (missing RESEND_API_KEY / RESEND_FROM_EMAIL).");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      attachments: params.attachments?.map((a) => ({
        filename: a.filename,
        content: btoa(a.content),
        content_type: a.contentType,
      })),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to send email (${res.status}): ${body || res.statusText}`);
  }
}
