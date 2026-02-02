import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html, text = null }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Render par host/port se behtar ye kaam karta hai
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false // Is se connection block nahi hota
      }
    });

    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Software House'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      ...(text && { text })
    });

    console.log("✅ Email Sent Successfully!");
    return info;
  } catch (err) {
    console.error("❌ Email Error:", err.message);
    return null;
  }
};

export default sendEmail;
