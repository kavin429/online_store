import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: nodemailer.SendMailOptions["attachments"];
};

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

let storeLogo: Buffer | null | undefined;

export function getStoreLogo() {
  if (storeLogo !== undefined) return storeLogo;

  try {
    storeLogo = fs.readFileSync(path.join(process.cwd(), "public", "logo.png"));
  } catch (error) {
    console.error("Unable to load email logo:", error);
    storeLogo = null;
  }

  return storeLogo;
}

export async function sendMail({ to, subject, text, html, attachments }: MailPayload) {
  const transport = getTransporter();

  if (!transport) {
    console.error("Email not configured: missing SMTP environment variables.");
    return false;
  }

  try {
    await transport.sendMail({
      from: process.env.NOTIFY_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
      attachments,
    });
    return true;
  } catch (error) {
    console.error(`Email failed for ${to}:`, error);
    return false;
  }
}
