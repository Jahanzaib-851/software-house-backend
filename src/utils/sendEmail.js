import { Resend } from 'resend';

// Aapki verified API Key
const resend = new Resend('re_dcBaVtjE_P78e2m9LzkQYxiECSGYCo8yu');

const sendEmail = async ({ to, subject, html, text = null }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Resend ka default sender
      to: to, // Shuru mein sirf apne email (jahanzaibhassan851@gmail.com) par test karein
      subject: subject,
      html: html || text,
    });

    if (error) {
      console.error("❌ Resend API Error:", error.message);
      return null;
    }

    console.log("✅ Email Sent via Resend API! ID:", data.id);
    return data;
  } catch (err) {
    console.error("❌ Connection Error:", err.message);
    return null;
  }
};

export default sendEmail;