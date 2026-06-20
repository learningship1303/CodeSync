import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

const getEmailPassword = (): string | undefined =>
  process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;

const getEmailUser = (): string | undefined => process.env.EMAIL_USER;

const getTransporter = (): Transporter => {
  const emailUser = getEmailUser();
  const emailPassword = getEmailPassword();

  if (!emailUser || !emailPassword) {
    throw new Error(
      'Email service is not configured. Set EMAIL_USER and EMAIL_PASS or EMAIL_PASSWORD.'
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }

  return transporter;
};

export const verifyEmailTransporter = async (): Promise<void> => {
  console.log('Email User:', getEmailUser() || '(not configured)');
  console.log('[EMAIL] Password configured:', Boolean(getEmailPassword()));

  try {
    await getTransporter().verify();
    console.log('[EMAIL] SMTP transporter verified successfully');
  } catch (error) {
    console.error('[EMAIL] SMTP transporter verification failed');
    console.error(error instanceof Error ? error.stack : error);
  }
};

export const sendOtpEmail = async (
  email: string,
  otp: string
) => {
  const emailUser = getEmailUser();
  const info = await getTransporter().sendMail({
    from: `"CodeSync" <${emailUser}>`,
    to: email,
    subject: 'Verify Your CodeSync Account',
    html: `
      <div style="font-family:Arial;padding:20px;background:#f5f5f5">
        <div style="background:white;padding:30px;border-radius:8px;max-width:500px;margin:0 auto">
          <h2 style="color:#333;margin-top:0">CodeSync Email Verification</h2>

          <p style="color:#666;line-height:1.6">Your verification code is:</p>

          <div style="background:#f0f0f0;padding:15px;border-radius:4px;margin:20px 0;text-align:center">
            <h1 style="color:#2563eb;margin:0;font-size:32px;letter-spacing:4px">${otp}</h1>
          </div>

          <p style="color:#666;line-height:1.6">This code expires in <strong>10 minutes</strong>.</p>

          <p style="color:#999;font-size:12px">If you didn't request this code, please ignore this email.</p>
        </div>
      </div>
    `,
  });

  console.log('[EMAIL] OTP email accepted by SMTP:', {
    to: email,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  otp: string
) => {
  const emailUser = getEmailUser();
  const info = await getTransporter().sendMail({
    from: `"CodeSync" <${emailUser}>`,
    to: email,
    subject: 'Reset Your CodeSync Password',
    html: `
      <div style="font-family:Arial;padding:20px;background:#f5f5f5">
        <div style="background:white;padding:30px;border-radius:8px;max-width:500px;margin:0 auto">
          <h2 style="color:#333;margin-top:0">Password Reset Request</h2>

          <p style="color:#666;line-height:1.6">We received a request to reset your password. Use the code below to proceed:</p>

          <div style="background:#f0f0f0;padding:15px;border-radius:4px;margin:20px 0;text-align:center">
            <h1 style="color:#dc2626;margin:0;font-size:32px;letter-spacing:4px">${otp}</h1>
          </div>

          <p style="color:#666;line-height:1.6">This code expires in <strong>15 minutes</strong>.</p>

          <p style="color:#999;font-size:12px">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      </div>
    `,
  });

  console.log('[EMAIL] Password reset email accepted by SMTP:', {
    to: email,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  });
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const emailUser = getEmailUser();
  const info = await getTransporter().sendMail({
    from: `"CodeSync" <${emailUser}>`,
    to: email,
    subject: 'Welcome to CodeSync!',
    html: `
      <div style="font-family:Arial;padding:20px;background:#f5f5f5">
        <div style="background:white;padding:30px;border-radius:8px;max-width:500px;margin:0 auto">
          <h2 style="color:#333;margin-top:0">Welcome to CodeSync, ${name}!</h2>

          <p style="color:#666;line-height:1.6">Your account has been successfully verified and is now active.</p>

          <p style="color:#666;line-height:1.6">You can now:</p>
          <ul style="color:#666;line-height:1.8">
            <li>Create collaborative workspaces</li>
            <li>Invite team members to collaborate in real-time</li>
            <li>Run code in multiple languages</li>
            <li>Use AI assistance with Copilot</li>
          </ul>

          <p style="color:#999;font-size:12px">Happy coding! 🎉</p>
        </div>
      </div>
    `,
  });

  console.log('[EMAIL] Welcome email accepted by SMTP:', {
    to: email,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  });
};
