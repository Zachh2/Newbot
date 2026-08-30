const os = require('os');
const process = require('process');

module.exports.config = {
    name: "stats",
    version: "1.0.0",
    hasPermssion: 0,
    description: "Show system status and memory information",
    usePrefix: true,
    hide: false,
    commandCategory: "System",
    usages: "?stats",
    cooldowns: 5,
    credits: "Jonell Magallanes"
};

module.exports.run = async function ({ api, event }) {
    try {
        const totalRAM = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
        const freeRAM = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
        const usedRAM = (os.totalmem() - os.freemem()) / (1024 * 1024 * 1024);
        const usedRAMPercent = ((usedRAM / (os.totalmem() / (1024 * 1024 * 1024))) * 100).toFixed(2);
        
        const uptimeSeconds = process.uptime();
        const uptimeDays = Math.floor(uptimeSeconds / 86400);
        const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600);
        const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
        const uptimeSecs = Math.floor(uptimeSeconds % 60);
        
        const systemStatus = usedRAMPercent > 80 ? "❌ Bad" : usedRAMPercent > 60 ? "⚠️ Average" : "✅ Good";
        
        const statsMessage = `🖥️ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗦𝗧𝗔𝗧𝗨𝗦\n━━━━━━━━━━━━━━━━━━\n📟 𝗢𝗦: ${os.type()} ${os.release()}\n💾 𝗥𝗔𝗠: ${freeRAM}GB / ${totalRAM}GB (${usedRAMPercent}% used)\n💿 𝗦𝗧𝗢𝗥𝗔𝗚𝗘: ${os.platform()}\n⏰ 𝗨𝗽𝘁𝗶𝗺𝗲 𝗕𝗼𝘁: ${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m ${uptimeSecs}s\n📊 𝗦𝘆𝘀𝘁𝗲𝗺: ${systemStatus}\n🆔 𝗛𝗼𝘀𝘁 𝗜𝗗: ${os.hostname()}\n⚡ 𝗡𝗼𝗱𝗲𝗷𝘀 𝗩𝗲𝗿𝘀𝗶𝗼𝗻: ${process.version}\n━━━━━━━━━━━━━━━━━━`;

        api.sendMessage(statsMessage, event.threadID);
        
    } catch (error) {
        console.error('Stats command error:', error);
        api.sendMessage("❌ | 𝖤𝗋𝗋𝗈𝗋 𝖿𝖾𝗍𝖼𝗁𝗂𝗇𝗀 𝗌𝗒𝗌𝗍𝖾𝗆 𝗌𝗍𝖺𝗍𝗎𝗌", event.threadID);
    }
};