import "server-only";
import nodemailer from "nodemailer";

const HOST = process.env.EMAIL_SERVER_HOST;
const PORT = Number(process.env.EMAIL_SERVER_PORT ?? 465);
const FROM =
  process.env.EMAIL_FROM ?? "Prode Mundial 2026 <no-reply@localhost>";

/** True when SMTP is configured (same env as the NextAuth nodemailer provider). */
export const emailConfigured = Boolean(HOST);

function getTransport() {
  if (!HOST) return null;
  return nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: PORT === 465,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

function shell(title: string, body: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;background:#ece5d0;color:#211d18;border-radius:12px">
    <h1 style="font-size:22px;margin:0 0 8px">⚽ ${title}</h1>
    ${body}
    <p style="margin-top:24px;font-size:12px;color:#6b6357">Prode Mundial 2026 · pozo privado</p>
  </div>`;
}

/** Returns true if the mail was sent, false if SMTP isn't configured. */
export async function sendInviteEmail(
  to: string,
  url: string,
): Promise<boolean> {
  const t = getTransport();
  if (!t) return false;
  await t.sendMail({
    from: FROM,
    to,
    subject: "Te invitaron al Prode Mundial 2026 ⚽",
    text: `Te sumaron al prode privado del Mundial 2026.\nEntrá y registrá tu passkey: ${url}`,
    html: shell(
      "Te invitaron al prode",
      `<p>Te sumaron al prode privado del Mundial 2026.</p>
       <p style="margin:16px 0"><a href="${url}" style="background:#c63e29;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600">Entrar y registrarme</a></p>
       <p style="font-size:12px;color:#6b6357">O copiá este link: ${url}</p>`,
    ),
  });
  return true;
}

export async function sendDeadlineReminder(
  to: string,
  opts: { count: number; url: string },
): Promise<boolean> {
  const t = getTransport();
  if (!t) return false;
  await t.sendMail({
    from: FROM,
    to,
    subject: "⏰ Cargá tus pronósticos",
    text: `Tenés ${opts.count} partido(s) por pronosticar que están por empezar. Cargalos: ${opts.url}`,
    html: shell(
      "Cargá tus pronósticos",
      `<p>Tenés <b>${opts.count}</b> partido(s) por pronosticar que están por empezar.</p>
       <p style="margin:16px 0"><a href="${opts.url}" style="background:#c63e29;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600">Cargar pronósticos</a></p>`,
    ),
  });
  return true;
}
