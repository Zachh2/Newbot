const axios = require('axios');

module.exports.config = {
    name: "spotify",
    version: "1.0.0",
    hasPermssion: 0,
    description: "Search and download audio from Spotify",
    usePrefix: true,
    hide: false,
    commandCategory: "Media",
    usages: "/spotify <song name>",
    cooldowns: 5,
    credits: "Jonell Magallanes"
};

module.exports.run = async function ({ api, event, args }) {
    if (!args[0]) {
        return api.sendMessage("❓ 𝗨𝗦𝗔𝗚𝗘\n━━━━━━━━━━━━━━━━━━\n📍 Please provide a song name or artist\nExample: /spotify Shape of You\n━━━━━━━━━━━━━━━━━━", event.threadID);
    }

    const query = args.join(' ');

    try {
        api.setMessageReaction("🔍", event.messageID, () => {}, true);

        const searchRes = await axios.get(`http://api.hutchingd.x10.mx/api/search/spt.php?query=${encodeURIComponent(query)}`, {
            timeout: 10000
        });

        if (!searchRes.data?.status || !searchRes.data.data?.length) {
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            return api.sendMessage("❌ 𝗡𝗼 𝗿𝗲𝘀𝘂𝗹𝘁𝘀 𝗳𝗼𝘂𝗻𝗱", event.threadID);
        }

        const track = searchRes.data.data[0];
        
        api.setMessageReaction("⬇️", event.messageID, () => {}, true);

        const dlRes = await axios.get(`http://api.hutchingd.x10.mx/api/dl/spt.php?url=${encodeURIComponent(track.track_url)}`, {
            timeout: 10000
        });

        if (!dlRes.data?.status || !dlRes.data.trackData?.[0]?.download_url) {
            throw new Error('Invalid download URL response');
        }

        const downloadUrl = dlRes.data.trackData[0].download_url;
        
        // Get the audio stream directly
        const audioResponse = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream',
            timeout: 30000
        });

        api.setMessageReaction("✅", event.messageID, () => {}, true);

        await api.sendMessage({
            body: `🎵 𝗦𝗣𝗢𝗧𝗜𝗙𝗬 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥\n━━━━━━━━━━━━━━━━━━\n📝 𝗧𝗶𝘁𝗹𝗲: ${track.title}\n🎤 𝗔𝗿𝘁𝗶𝘀𝘁: ${track.artist}\n✅ 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝗱𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗱 𝘀𝗼𝗻𝗴\n━━━━━━━━━━━━━━━━━━`,
            attachment: audioResponse.data
        }, event.threadID, event.messageID);

    } catch (error) {
        console.error('Spotify Command Error:', error.message);
        
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        
        api.sendMessage(`❌ 𝗘𝗥𝗥𝗢𝗥\n━━━━━━━━━━━━━━━━━━\n💀 𝗘𝗿𝗿𝗼𝗿: ${error.message}\n💡 𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝗿𝘆 𝗮𝗴𝗮𝗶𝗻 𝗹𝗮𝘁𝗲𝗿\n━━━━━━━━━━━━━━━━━━`, event.threadID, event.messageID);
    }
};