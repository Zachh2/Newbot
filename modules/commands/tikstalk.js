const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "tikstalk",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Jonell Hutchin Magallanes",
    description: "Get TikTok user profile info",
    usePrefix: true,
    commandCategory: "media",
    usages: "tikstalk [username]",
    cooldowns: 5,
    dependencies: {
        "axios": "",
        "fs-extra": ""
    }
};

module.exports.run = async function ({ api, event, args }) {
    const username = args.join(" ");
    if (!username) return api.sendMessage("Please provide a TikTok username.", event.threadID, event.messageID);

    try {
        api.setMessageReaction("⏳", event.messageID, () => {}, true);

        const url = `https://ccprojectsapis.zetsu.xyz/api/tikstalk?unique_id=${encodeURIComponent(username)}`;
        const res = await axios.get(url);

        if (!res.data || !res.data.username) {
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            return api.sendMessage("❌ User not found.", event.threadID, event.messageID);
        }

        const data = res.data;

        const avatarPath = path.join(__dirname, "cache", `avatar_${Date.now()}.jpg`);
        const avatarResponse = await axios.get(data.avatarLarger, { responseType: "arraybuffer" });
        await fs.writeFile(avatarPath, Buffer.from(avatarResponse.data, "binary"));

        api.setMessageReaction("✅", event.messageID, () => {}, true);

        await api.sendMessage({
            body: `𝗧𝗶𝗸𝗧𝗼𝗸 𝗨𝘀𝗲𝗿 𝗦𝘁𝗮𝗹𝗸\n━━━━━━━━━━━━━━━━━━\n\n` +
                  `🆔 𝗜𝗗: ${data.id}\n` +
                  `👤 𝗡𝗶𝗰𝗸𝗻𝗮𝗺𝗲: ${data.nickname}\n` +
                  `🔗 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲: ${data.username}\n` +
                  `📝 𝗦𝗶𝗴𝗻𝗮𝘁𝘂𝗿𝗲: ${data.signature || "None"}\n` +
                  `🔑 𝗦𝗲𝗰𝗨𝗜𝗗: ${data.secUid}\n` +
                  `🎥 𝗩𝗶𝗱𝗲𝗼 𝗖𝗼𝘂𝗻𝘁: ${data.videoCount}\n` +
                  `👥 𝗙𝗼𝗹𝗹𝗼𝘄𝗶𝗻𝗴: ${data.followingCount}\n` +
                  `👥 𝗙𝗼𝗹𝗹𝗼𝘄𝗲𝗿𝘀: ${data.followerCount}\n` +
                  `❤️ 𝗟𝗶𝗸𝗲𝘀 (𝗛𝗲𝗮𝗿𝘁𝘀): ${data.heartCount}\n` +
                  `👍 𝗗𝗶𝗴𝗴 𝗖𝗼𝘂𝗻𝘁: ${data.diggCount}`,
            attachment: fs.createReadStream(avatarPath)
        }, event.threadID, () => fs.unlinkSync(avatarPath));

    } catch (err) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        api.sendMessage("⚠️ Error: " + err.message, event.threadID, event.messageID);
    }
};