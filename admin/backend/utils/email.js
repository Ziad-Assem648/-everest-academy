import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTPEmail(to, otp) {
  const info = await transporter.sendMail({
    from: `"Everest Academy" <${process.env.SMTP_USER}>`,
    to,
    subject: "Everest Academy — Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #d4af37; text-align: center;">Everest Academy</h2>
        <p style="font-size: 15px; color: #333;">Hello,</p>
        <p style="font-size: 14px; color: #555;">Your verification code is:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #d4af37;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #888;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #aaa; text-align: center;">Everest Academy &copy; ${new Date().getFullYear()}</p>
      </div>
    `,
  });
  return info;
}
