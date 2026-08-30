const { exec } = require("child_process");

module.exports.config = {
  name: "shell",
  version: "1.0",
  hasPermssion: 2,
  credits: "Jonell Hutchin Magallanes",
  description: "Execute shell commands",
  usePrefix: true,
  commandCategory: "system",
  usages: "<prefix>shell <command>",
  cooldowns: 5,
};

module.exports.run = async function({ api, event, args }) {
  const command = args.join(" ");
  if (!command) return api.sendMessage("❌ Please provide a command to run.", event.threadID, event.messageID);

  exec(command, { timeout: 10000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) return api.sendMessage(`⚠️ Error:\n${error.message}`, event.threadID, event.messageID);
    if (stderr) return api.sendMessage(`⚠️ Stderr:\n${stderr}`, event.threadID, event.messageID);
    if (stdout.length === 0) return api.sendMessage("✅ Command executed, but no output.", event.threadID, event.messageID);

    api.sendMessage(`📟 Output:\n${stdout.substring(0, 1900)}`, event.threadID, event.messageID);
  });
};