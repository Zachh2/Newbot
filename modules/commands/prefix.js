module.exports.config = {
  name: "prefix",
  version: "1.0.0",
  hasPermssion: 0,
  description: "Auto response for prefix inquiries",
  usePrefix: false,
  commandCategory: "System",
  cooldowns: 3,
  credits: "Jonell Magallanes"
};

module.exports.handleEvent = async ({ api, event }) => {
  const body = event.body ? event.body.toLowerCase() : "";
  const prefix = global.config.PREFIX;
  
  const prefixKeywords = [
    "what is prefix",
    "what is the prefix",
    "prefix",
    "ano prefix",
    "ano ang prefix",
    "paano mag command",
    "how to use bot",
    "command list",
    "commands",
    "bot prefix"
  ];

  if (prefixKeywords.some(keyword => body.includes(keyword))) {
    const message = `╔══════════════════╗\n` +
      `║  🤖 𝗕𝗢𝗧 𝗣𝗥𝗘𝗙𝗜𝗫  🤖  \n` +
      `╚══════════════════╝\n\n` +
      `📌 My prefix is:  ${prefix}\n\n` +
      `💡 Example: ${prefix}help\n\n` +
      `✨ Type ${prefix}help to see all commands!`;
    
    api.sendMessage(message, event.threadID, event.messageID);
  }
};

module.exports.run = async ({ api, event }) => {
  const prefix = global.config.PREFIX;
  
  const message = `╔══════════════════╗\n` +
    `║  🤖 𝗕𝗢𝗧 𝗣𝗥𝗘𝗙𝗜𝗫  🤖  \n` +
    `╚══════════════════╝\n\n` +
    `📌 My prefix is:  ${prefix}\n\n` +
    `💡 Example: ${prefix}help\n\n` +
    `✨ Type ${prefix}help to see all commands!`;
  
  api.sendMessage(message, event.threadID, event.messageID);
};