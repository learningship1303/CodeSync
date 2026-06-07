import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (
  email: string,
  otp: string
) => {
  await transporter.sendMail({
    from: `"CodeSync" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your CodeSync Account',
    html: `
      <div style="font-family:Arial;padding:20px">
        <h2>CodeSync Email Verification</h2>

        <p>Your verification code is:</p>

        <h1>${otp}</h1>

        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
};