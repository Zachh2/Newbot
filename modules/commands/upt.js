const os = require("os");
const disk = require("diskusage");

module.exports.config = {
  name: "upt",
  version: "1.1",
  hasPermssion: 0,
  credits: "Jonell Hutchin Magallanes",
  description: "Show system uptime, OS, RAM, and storage info",
  usePrefix: true,
  commandCategory: "system",
  usages: "<prefix>upt",
  cooldowns: 30,
};

module.exports.run = async function({ api, event }) {
  const uptimeSeconds = process.uptime();
  const uptime = new Date(uptimeSeconds * 1000).toISOString().substr(11, 8);
  const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
  const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
  const cpus = os.cpus();
  const loadAvg = os.loadavg().map(x => x.toFixed(2)).join(", ");

  let storageMsg = "Storage info not available";
  try {
    const { total, free } = await disk.check("/");
    const totalGB = (total / 1024 / 1024 / 1024).toFixed(2);
    const freeGB = (free / 1024 / 1024 / 1024).toFixed(2);
    storageMsg = `${freeGB} GB free / ${totalGB} GB total`;
  } catch (e) {}

  const message = 
`📊 System Info 📊
🖥 OS: ${os.type()} ${os.release()}
📂 Arch: ${os.arch()}
⏱ Uptime: ${uptime}
💾 RAM: ${freeMem} GB free / ${totalMem} GB total
📦 Storage: ${storageMsg}
⚙️ CPU: ${cpus[0].model} (${cpus.length} cores)
📈 Load Avg: ${loadAvg}`;

  api.sendMessage(message, event.threadID, event.messageID);
};