import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html, text = null }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // SSL connection (Render ke liye best hai)
      auth: {
        // Agar process.env nahi mil raha toh direct ye wala email/pass use hoga
        user: process.env.SMTP_USER || "jahanzaibhassan851@gmail.com",
        pass: process.env.SMTP_PASS || "ocfldwbzduxwebhm"
      },
      tls: {
        rejectUnauthorized: false // Security check bypass for cloud servers
      },
      connectionTimeout: 15000, // 15 seconds wait karega connection ke liye
      greetingTimeout: 15000
    });

    const info = await transporter.sendMail({
      from: `"Software House" <jahanzaibhassan851@gmail.com>`,
      to,
      subject,
      html,
      ...(text && { text })
    });

    console.log("✅ Email successfully sent to:", to);
    return info;
  } catch (err) {
    console.error("❌ Email Error Found!");
    console.error("Message:", err.message);
    // Error throw nahi kar rahe taake server chalta rahe
    return null;
  }
};

export default sendEmail;