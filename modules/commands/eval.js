module.exports.config = {
  name: "eval",
  version: "1.0.0",
  hasPermssion: 2,
  description: "Execute JavaScript code",
  usePrefix: true,
  commandCategory: "System",
  usages: "[code]",
  cooldowns: 0,
  credits: "Jonell Magallanes"
};

module.exports.run = async ({ api, event, args }) => {
  const code = args.join(" ");
  
  if (!code) {
    return api.sendMessage("❌ Please provide code to execute.", event.threadID, event.messageID);
  }
  
  try {
    const result = await eval(`(async () => { ${code} })()`);
    const output = typeof result === "object" ? JSON.stringify(result, null, 2) : String(result);
    
    api.sendMessage(output || "undefined", event.threadID, event.messageID);
  } catch (error) {
    api.sendMessage(error.message, event.threadID, event.messageID);
  }
};