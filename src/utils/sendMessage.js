const sendMessage = async (to, message) => {
  try {
    // future: SMS / Email / Push logic
    console.log(`Message sent to ${to}: ${message}`);
    return true;
  } catch (error) {
    console.error("Send message error:", error);
    return false;
  }
};

export default sendMessage;
