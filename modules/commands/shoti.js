const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "shoti",
  version: "1.0.7",
  credits: "zycke",
  description: "Generate random tiktok girl videos",
  hasPermssion: 0,
  commandCategory: "media",
  usage: "[shoti]",
  cooldowns: 30,
  dependencies: [],
  usePrefix: true
};

module.exports.run = async function({ api, event }) {
  const cachePath = path.join(__dirname, "cache");
  const videoPath = path.join(cachePath, "shoti.mp4");

  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath);
  }

  try {
    const loadingMsg = await api.sendMessage("⏳ Loading...", event.threadID);
    
    const res = await axios.get("https://betadash-shoti-yazky.vercel.app/shotizxx?apikey=shipazu");
    const videoUrl = res.data.shotiurl;

    if (!videoUrl) {
      return api.editMessage("❌ No video found!", loadingMsg.messageID);
    }

    const response = await axios({
      url: videoUrl,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(videoPath);
    response.data.pipe(writer);

    writer.on("finish", async () => {
      const message = {
        body: `╭─〔 𝙎𝙃𝙊𝙏𝙄 𝙑𝙄𝘿𝙀𝙊 〕─⬣\n👤 𝙐𝙨𝙚𝙧𝙣𝙖𝙢𝙚: ${res.data.username}\n📛 𝙉𝙞𝙘𝙠𝙣𝙖𝙢𝙚: ${res.data.nickname}\n🌍 𝙍𝙚𝙜𝙞𝙤𝙣: ${res.data.region}\n🎬 𝘿𝙪𝙧𝙖𝙩𝙞𝙤𝙣: ${res.data.duration}s\n╰──────────────⬣`,
        attachment: fs.createReadStream(videoPath)
      };
      
      await api.sendMessage(message, event.threadID);
      api.unsendMessage(loadingMsg.messageID);
      
      fs.unlinkSync(videoPath);
    });

    writer.on("error", (err) => {
      console.error(err);
      api.editMessage("❌ Error downloading video!", loadingMsg.messageID);
    });

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Failed to fetch video!", event.threadID, event.messageID);
  }
};