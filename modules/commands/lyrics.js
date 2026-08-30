const axios = require("axios");

module.exports.config = {
    name: "lyrics",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Jonell Hutchin Magallanes",
    description: "Get lyrics of a song",
    usePrefix: true,
    commandCategory: "media",
    usages: "lyrics [song name]",
    cooldowns: 5,
    dependencies: {
        "axios": ""
    }
};

module.exports.run = async function ({ api, event, args }) {
    const song = args.join(" ");
    if (!song) return api.sendMessage("⚠️ Please provide a song name.", event.threadID, event.messageID);

    try {
        api.setMessageReaction("⏳", event.messageID, () => {}, true);

        const url = `https://api.popcat.xyz/v2/lyrics?song=${encodeURIComponent(song)}`;
        const res = await axios.get(url);

        if (res.data.error || !res.data.message) {
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            return api.sendMessage("❌ Lyrics not found.", event.threadID, event.messageID);
        }

        const data = res.data.message;

        // Get the image stream directly
        const imgResponse = await axios({
            method: 'get',
            url: data.image,
            responseType: 'stream'
        });

        const message = 
`𝗟𝘆𝗿𝗶𝗰𝘀 𝗙𝗼𝘂𝗻𝗱 🎶
━━━━━━━━━━━━━━━━━━

🎵 𝗧𝗶𝘁𝗹𝗲: ${data.title}
🎤 𝗔𝗿𝘁𝗶𝘀𝘁: ${data.artist}
🔗 𝗟𝗶𝗻𝗸: ${data.url}

📑 𝗟𝘆𝗿𝗶𝗰𝘀:
${data.lyrics}`;

        await api.sendMessage({
            body: message,
            attachment: imgResponse.data
        }, event.threadID, event.messageID);

        api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (err) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        api.sendMessage("⚠️ Error: " + err.message, event.threadID, event.messageID);
    }
};