module.exports.config = {
  name: "button",
  version: "1.0.0",
  hasPermssion: 0,
  description: "Test button functionality",
  usePrefix: true,
  commandCategory: "System",
  usages: "",
  cooldowns: 5,
  credits: "Jonell Magallanes"
};

module.exports.run = async ({ api, event }) => {
  try {
    const call_to_actions = "EUWjAH_Z.dO$qc0AJmHdbTiNO8skp5MvmN";
    const text = "Click the button below to test!";
    const threadID = event.threadID;
    const messageID = event.messageID;
    
    api.sendButtons(call_to_actions, text, threadID, messageID, (err, data) => {
      if (err) {
        console.error("Button error:", err);
        return api.sendMessage(err, threadID, messageID);
      }
      
      if (data && data.action === "cta_buttons") {
        api.sendMessage("✅ Button clicked! Action triggered.", threadID, messageID);
      }
    });
  } catch (error) {
    console.error("Command error:", error);
    api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
  }
};