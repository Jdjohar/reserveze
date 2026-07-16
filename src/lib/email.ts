/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || '"Reserveze" <onboarding@resend.dev>';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || '"Reserveze Notifications" <no-reply@reserveze.com>';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    const cleanTo = to.toLowerCase().trim();

    // Auto-detect Resend key from SMTP settings if RESEND_API_KEY is not defined explicitly
    const activeApiKey = RESEND_API_KEY || (SMTP_HOST === 'smtp.resend.com' && SMTP_PASS.startsWith('re_') ? SMTP_PASS : '');
    const activeFrom = activeApiKey ? (process.env.RESEND_FROM || SMTP_FROM || RESEND_FROM) : SMTP_FROM;

    // 1. Try Resend API (Primary modern provider)
    if (activeApiKey) {
      console.log(`[Email Service] Attempting to send email via Resend API to: ${cleanTo} (From: ${activeFrom})`);
      const resend = new Resend(activeApiKey);
      
      const { data, error } = await resend.emails.send({
        from: activeFrom,
        to: cleanTo,
        subject,
        html,
      });

      if (error) {
        console.error('[Email Service] Resend API error:', error);
        throw new Error(error.message);
      }

      console.log(`[Email Service] Email sent successfully via Resend API. Id: ${data?.id}`);
      return { success: true, messageId: data?.id };
    }

    // 2. Fallback to Nodemailer SMTP
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      console.log(`[Email Service] Attempting to send email via Nodemailer SMTP to: ${cleanTo}`);
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to: cleanTo,
        subject,
        html,
      });

      console.log(`[Email Service] Email sent successfully via SMTP. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    }

    // 3. Mock Fallback (For local testing without any API credentials)
    console.log('==================================================');
    console.log(`[Email Service] (MOCK LOG - Resend/SMTP not configured)`);
    console.log(`TO: ${cleanTo}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`HTML CONTENT:\n${html}`);
    console.log('==================================================');
    return { success: true, mock: true };

  } catch (err: any) {
    console.error(`[Email Service] Failed to send email to ${to}:`, err);
    return { success: false, error: err.message };
  }
}
