export async function sendOTPEmail(to, otp) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.SMTP_USER || "Everest Academy <onboarding@resend.dev>";

  const otpHtml = `
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
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Everest Academy — Password Reset Code",
      html: otpHtml,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Email send failed");
  return { success: true, messageId: data.id };
}
