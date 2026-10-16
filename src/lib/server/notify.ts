import 'server-only';
import { site } from '@/config/site';

/**
 * New-lead / new-booking notifications for Romany.
 * - Email via Resend (RESEND_API_KEY + NOTIFY_EMAIL_TO; optional NOTIFY_EMAIL_FROM)
 * - Telegram bot message (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID), optional
 * Both are skipped silently when not configured. Called inside `after()` so visitors never wait.
 */
export interface Notice {
  subject: string;
  lines: [label: string, value: string | null | undefined][];
  /** Link to the lead in the admin inbox. */
  adminPath?: string;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function notify(notice: Notice): Promise<void> {
  const rows = notice.lines.filter(([, v]) => v != null && v !== '') as [string, string][];
  const link = notice.adminPath ? `${site.url}${notice.adminPath}` : null;
  await Promise.allSettled([sendEmail(notice.subject, rows, link), sendTelegram(notice.subject, rows, link)]);
}

async function sendEmail(subject: string, rows: [string, string][], link: string | null) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL_TO;
  if (!key || !to) return;
  const from = process.env.NOTIFY_EMAIL_FROM ?? `${site.brand} <onboarding@resend.dev>`;
  const html = `
    <div style="font-family:system-ui,sans-serif;color:#24303A;line-height:1.6">
      <h2 style="margin:0 0 12px">${esc(subject)}</h2>
      <table style="border-collapse:collapse">${rows
        .map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#5B6873">${esc(k)}</td><td style="padding:4px 0;white-space:pre-wrap">${esc(v)}</td></tr>`)
        .join('')}</table>
      ${link ? `<p style="margin-top:20px"><a href="${esc(link)}" style="background:#2B76A6;color:#fff;padding:10px 18px;border-radius:12px;text-decoration:none">Open in your inbox</a></p>` : ''}
    </div>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: to.split(',').map((s) => s.trim()), subject, html }),
  });
  if (!res.ok) console.error('[notify:email]', res.status, await res.text());
}

async function sendTelegram(subject: string, rows: [string, string][], link: string | null) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  const text = [`*${subject}*`, ...rows.map(([k, v]) => `${k}: ${v}`), link ?? ''].filter(Boolean).join('\n');
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  if (!res.ok) console.error('[notify:telegram]', res.status, await res.text());
}

/** Sends Romany's reply to a lead by email (used by the admin inbox). */
export async function emailLead(to: string, subject: string, body: string, replyTo?: string | null): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const from = process.env.NOTIFY_EMAIL_FROM ?? `${site.brand} <onboarding@resend.dev>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      reply_to: replyTo ?? undefined,
      html: `<div style="font-family:system-ui,sans-serif;color:#24303A;line-height:1.7;white-space:pre-wrap">${esc(body)}</div>`,
    }),
  });
  return res.ok;
}
