import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  message: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }

  const { name, email, message } = parsed.data;

  const resend = new Resend(process.env.ReSendKey);

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 4px">[Ferric] Support Request</h2>
  <p style="margin:0 0 24px;color:#666;font-size:14px">${new Date().toISOString()}</p>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tbody>
      <tr><td style="padding:6px 12px;color:#666;width:80px">Name</td><td style="padding:6px 12px">${name}</td></tr>
      <tr style="background:#fafafa"><td style="padding:6px 12px;color:#666">Email</td><td style="padding:6px 12px"><a href="mailto:${email}">${email}</a></td></tr>
    </tbody>
  </table>

  <h3 style="margin:0 0 8px;font-size:16px">Message</h3>
  <p style="margin:0;white-space:pre-wrap;background:#f9f9f9;padding:16px;border-radius:4px">${message}</p>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: 'noreply@faithbranch.com',
    to: 'sneiswanger@faithbranch.com',
    replyTo: email,
    subject: `[Ferric Support] Message from ${name}`,
    html,
  });

  if (error) {
    console.error('[ferric/contact] resend error', error);
    return NextResponse.json({ ok: false, error: 'Failed to send' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
