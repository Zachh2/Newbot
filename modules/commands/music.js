const axios = require("axios");
const yts = require("yt-search");

const threadCooldowns = new Map();

module.exports.config = {
    name: "music",
    version: "1.2.0",
    hasPermssion: 0,
    description: "Play and download YouTube music",
    usePrefix: true,
    hide: false,
    commandCategory: "Music",
    usages: "<song name>",
    cooldowns: 1,
    credits: "Jonell Magallanes"
};

module.exports.run = async ({ api, event, args }) => {
    try {
        const threadID = event.threadID;
        
        if (threadCooldowns.has(threadID)) {
            const cooldownData = threadCooldowns.get(threadID);
            const remainingTime = Math.ceil((cooldownData.timestamp + 40000 - Date.now()) / 1000);
            
            if (remainingTime > 0) {
                const cooldownMessage = await api.sendMessage(`⏳ Music command is in cooldown. Please wait ${remainingTime} seconds.`, threadID);
                
                setTimeout(async () => {
                    try {
                        await api.unsendMessage(cooldownMessage.messageID);
                    } catch (e) {}
                }, 10000);
                
                return;
            }
        }

        const query = args.join(" ");
        if (!query) return api.sendMessage("❌ Please provide a song name to search.", threadID, event.messageID);

        const search = await yts(query);
        if (!search.videos.length) return api.sendMessage("❌ No results found.", threadID, event.messageID);

        const video = search.videos[0];
        const url = video.url;

        api.setMessageReaction("⏳", event.messageID, () => {}, true);

        const apiUrl = `https://ccproject.serv00.net/ytdl2.php?url=${encodeURIComponent(url)}`;
        const res = await axios.get(apiUrl);
        const { download } = res.data;

        const audioResponse = await axios({
            method: 'get',
            url: download,
            responseType: 'stream'
        });

        threadCooldowns.set(threadID, {
            timestamp: Date.now()
        });

        // Fixed: Remove the callback and handle the reply separately
        const musicMessage = await api.sendMessage(
            {
                body: `🎶 𝗠𝘂𝘀𝗶𝗰 𝗣𝗹𝗮𝘆𝗲𝗿 𝗬𝗼𝘂𝗧𝘂𝗯𝗲\n━━━━━━━━━━━━━━━━━━\nTitle: ${video.title}\nAuthor: ${video.author.name}\nDuration: ${video.timestamp}\nYouTube URL: ${video.url}\n\n💾 Type "dl" or "download" to get download link`,
                attachment: audioResponse.data
            },
            threadID
        );

        // Set reaction after sending the message
        api.setMessageReaction("✅", event.messageID, () => {}, true);

        // Store the handleReply data after successful message send
        if (musicMessage && musicMessage.messageID) {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: musicMessage.messageID,
                author: event.senderID,
                downloadUrl: download
            });
        }

    } catch (err) {
        console.error('Music command error:', err);
        api.sendMessage("❌ Error: Unable to fetch music.", event.threadID, event.messageID);
    }
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
    try {
        const { threadID, body, senderID } = event;
        const { author, downloadUrl, messageID } = handleReply;

        if (senderID !== author) return;

        const message = body.toLowerCase().trim();

        if (message === "dl" || message === "download") {
            const downloadMessage = await api.sendMessage({
                body: `📥 Download URL:\n${downloadUrl}`
            }, threadID);
            
            setTimeout(async () => {
                try {
                    await api.unsendMessage(downloadMessage.messageID);
                    await api.unsendMessage(messageID);
                } catch (e) {}
            }, 50000);
        }
    } catch (error) {
        console.error("Handle reply error:", error);
    }
};