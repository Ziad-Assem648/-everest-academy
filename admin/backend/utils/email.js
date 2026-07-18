import tls from "tls";

export function sendOTPEmail(to, otp) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { sock.destroy(); reject(new Error("SMTP timeout")); }, 15000);
    let step = "connect";

    const sock = tls.connect(port, host, { rejectUnauthorized: false }, () => {});

    const send = (line) => { sock.write(line + "\r\n"); };

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

    sock.on("data", (data) => {
      const lines = data.toString().split("\r\n").filter(l => l.length > 0);

      for (const line of lines) {
        const code = parseInt(line.substring(0, 3));
        const isLast = line[3] === " ";

        if (step === "connect" && code === 220) {
          send("EHLO everest");
          step = "ehlo";
        } else if (step === "ehlo" && isLast && code === 250) {
          send("AUTH LOGIN");
          step = "auth-user";
        } else if (step === "auth-user" && code === 334) {
          send(Buffer.from(user).toString("base64"));
          step = "auth-pass";
        } else if (step === "auth-pass" && code === 334) {
          send(Buffer.from(pass).toString("base64"));
          step = "auth-result";
        } else if (step === "auth-result" && code === 235) {
          send(`MAIL FROM:<${user}>`);
          step = "mail-from";
        } else if (step === "auth-result" && code >= 400) {
          clearTimeout(timer);
          reject(new Error("SMTP auth failed: " + line));
        } else if (step === "mail-from" && isLast && code === 250) {
          send(`RCPT TO:<${to}>`);
          step = "rcpt-to";
        } else if (step === "rcpt-to" && isLast && code === 250) {
          send("DATA");
          step = "data";
        } else if (step === "data" && code === 354) {
          const encodedSubject = "=?UTF-8?B?" + Buffer.from("Everest Academy — Password Reset Code").toString("base64") + "?=";
          const msg = `From: Everest Academy <${user}>\r\nTo: <${to}>\r\nSubject: ${encodedSubject}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${otpHtml}\r\n.`;
          send(msg);
          step = "data-sent";
        } else if (step === "data-sent" && isLast && code === 250) {
          send("QUIT");
          clearTimeout(timer);
          resolve({ success: true, messageId: `otp-${Date.now()}` });
        }
      }
    });

    sock.on("error", (e) => { clearTimeout(timer); reject(e); });
  });
}
