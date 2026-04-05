import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';

const metaSchema = z.object({
  company: z.string(),
  owner: z.string(),
  email: z.string(),
  appVersion: z.string(),
  platform: z.enum(['ios', 'android']),
  platformVersion: z.string(),
  jobCount: z.number(),
  contactCount: z.number(),
  fromScreen: z.string().nullable(),
  timestamp: z.string(),
});

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general', 'other']),
  summary: z.string().min(1),
  details: z.string(),
  rating: z.number().min(1).max(5).nullable(),
  meta: metaSchema,
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }

  try {
    await storeFeedback(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[feedback]', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

async function storeFeedback(payload: z.infer<typeof feedbackSchema>) {
  const resend = new Resend(process.env.ReSendKey);
  const { meta } = payload;

  const stars = payload.rating
    ? '★'.repeat(payload.rating) + '☆'.repeat(5 - payload.rating)
    : null;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 4px">[Blue Forge] ${payload.type.charAt(0).toUpperCase() + payload.type.slice(1)} Feedback</h2>
  <p style="margin:0 0 24px;color:#666;font-size:14px">${meta.timestamp}</p>

  <h3 style="margin:0 0 8px;font-size:16px">Summary</h3>
  <p style="margin:0 0 16px">${payload.summary}</p>

  ${payload.details ? `<h3 style="margin:0 0 8px;font-size:16px">Details</h3><p style="margin:0 0 16px;white-space:pre-wrap">${payload.details}</p>` : ''}

  ${stars ? `<h3 style="margin:0 0 8px;font-size:16px">Rating</h3><p style="margin:0 0 24px;font-size:20px;letter-spacing:2px">${stars}</p>` : ''}

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead>
      <tr>
        <th colspan="2" style="text-align:left;padding:8px 12px;background:#f0f0f0;font-size:13px;text-transform:uppercase;letter-spacing:.5px">App Info</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="padding:6px 12px;color:#666;width:140px">Version</td><td style="padding:6px 12px">${meta.appVersion}</td></tr>
      <tr style="background:#fafafa"><td style="padding:6px 12px;color:#666">Platform</td><td style="padding:6px 12px">${meta.platform} ${meta.platformVersion}</td></tr>
      <tr><td style="padding:6px 12px;color:#666">From Screen</td><td style="padding:6px 12px">${meta.fromScreen ?? '—'}</td></tr>
    </tbody>
  </table>

  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr>
        <th colspan="2" style="text-align:left;padding:8px 12px;background:#f0f0f0;font-size:13px;text-transform:uppercase;letter-spacing:.5px">User Info</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="padding:6px 12px;color:#666;width:140px">Company</td><td style="padding:6px 12px">${meta.company}</td></tr>
      <tr style="background:#fafafa"><td style="padding:6px 12px;color:#666">Owner</td><td style="padding:6px 12px">${meta.owner}</td></tr>
      <tr><td style="padding:6px 12px;color:#666">Email</td><td style="padding:6px 12px"><a href="mailto:${meta.email}">${meta.email}</a></td></tr>
      <tr style="background:#fafafa"><td style="padding:6px 12px;color:#666">Jobs</td><td style="padding:6px 12px">${meta.jobCount}</td></tr>
      <tr><td style="padding:6px 12px;color:#666">Contacts</td><td style="padding:6px 12px">${meta.contactCount}</td></tr>
    </tbody>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: 'noreply@faithbranch.com',
    to: 'sneiswanger@faithbranch.com',
    subject: `[Blue Forge Feedback] ${payload.type}: ${payload.summary}`,
    html,
  });

  if (error) {
    console.error('[feedback] resend error', error);
    throw new Error('Failed to send feedback email');
  }
}
