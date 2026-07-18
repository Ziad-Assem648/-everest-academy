import tls from "tls";

function smtpSend({ host, port, user, pass, from, to, subject, html }) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { sock.destroy(); reject(new Error("SMTP timeout")); }, 15000);
    let step = "connect";

    const sock = tls.connect(port, host, { rejectUnauthorized: false }, () => {});

    const send = (line) => { console.log(">>>", line); sock.write(line + "\r\n"); };

    sock.on("data", (data) => {
      const raw = data.toString();
      const lines = raw.split("\r\n").filter(l => l.length > 0);

      for (const line of lines) {
        console.log("<<<", line);
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
          send(`MAIL FROM:<${from}>`);
          step = "mail-from";
        } else if (step === "auth-result" && code >= 400) {
          clearTimeout(timer);
          reject(new Error("Auth failed: " + line));
        } else if (step === "mail-from" && isLast && code === 250) {
          send(`RCPT TO:<${to}>`);
          step = "rcpt-to";
        } else if (step === "rcpt-to" && isLast && code === 250) {
          send("DATA");
          step = "data";
        } else if (step === "data" && code === 354) {
          const encodedSubject = "=?UTF-8?B?" + Buffer.from(subject).toString("base64") + "?=";
          const msg = `From: Everest Academy <${from}>\r\nTo: <${to}>\r\nSubject: ${encodedSubject}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}\r\n.`;
          send(msg);
          step = "data-sent";
        } else if (step === "data-sent" && isLast && code === 250) {
          send("QUIT");
          clearTimeout(timer);
          resolve(true);
        }
      }
    });

    sock.on("error", (e) => { clearTimeout(timer); reject(e); });
  });
}

try {
  await smtpSend({
    host: "smtp.gmail.com",
    port: 465,
    user: "enerest.academy2026@gmail.com",
    pass: "yxjp lhoc cago fszr",
    from: "enerest.academy2026@gmail.com",
    to: "ziadassem97@gmail.com",
    subject: "Everest Academy - Test OTP",
    html: "<h1 style='color:#d4af37'>Your verification code is: 123456</h1>",
  });
  console.log("SENT SUCCESSFULLY");
} catch (e) {
  console.log("ERROR:", e.message);
}
