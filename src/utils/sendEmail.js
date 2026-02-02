import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html, text = null }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      // Live server par 465 best hai, lekin 587 bhi chal jata hai agar secure false ho
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // 🚨 Ye niche wali lines live server (Render) ke liye bohot zaroori hain
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
      ...(text && { text })
    });

    console.log("✅ Email successfully sent to:", to);
    console.log("📩 Message ID:", info.messageId);
    return info;
  } catch (err) {
    // 🚨 Ye detail logs aapko Render ke dashboard mein nazar ayenge
    console.error("❌ Email Sending Failed!");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    throw err;
  }
};

export default sendEmail;