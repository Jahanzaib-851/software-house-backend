import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html, text = null }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
      ...(text && { text })
    });

    console.log("Email sent:", info.messageId); // ✅ this will show actual messageId
    return info;
  } catch (err) {
    console.error("Email failed:", err);      // ✅ shows real error
    throw err;
  }
};

export default sendEmail;
