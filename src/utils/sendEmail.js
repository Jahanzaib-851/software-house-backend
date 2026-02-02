import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html, text = null }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // Direct host likh dein taake env ka masla na ho
      port: 465,             // Render par 465 (SSL) sabse best chalta hai
      secure: true,          // 465 ke liye hamesha true
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false, // Security check bypass for Render
        minVersion: "TLSv1.2"      // Purane protocols block karne ke liye
      },
      connectionTimeout: 10000,    // 10 seconds wait karega
      greetingTimeout: 10000
    });

    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Software House'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      ...(text && { text })
    });

    console.log("✅ Email successfully sent to:", to);
    return info;
  } catch (err) {
    console.error("❌ Email Sending Failed!");
    console.error("Error Message:", err.message);
    throw err;
  }
};

export default sendEmail;