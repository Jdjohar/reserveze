/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || '"Reserveze Notifications" <no-reply@reserveze.com>';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
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
        to,
        subject,
        html,
      });

      console.log(`[Email Service] Real email sent successfully to ${to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log('==================================================');
      console.log(`[Email Service] (MOCK LOG - SMTP not configured)`);
      console.log(`TO: ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`HTML CONTENT:\n${html}`);
      console.log('==================================================');
      return { success: true, mock: true };
    }
  } catch (err: any) {
    console.error(`[Email Service] Failed to send email to ${to}:`, err);
    return { success: false, error: err.message };
  }
}
