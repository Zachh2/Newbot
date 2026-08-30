module.exports.config = {
  name: "pinayflix",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Zycke",
  description: "Pick and send video",
  usePrefix: true,
  commandCategory: "media",
  usages: "[page]",
  cooldowns: 5
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const axios = require("axios");
  const fs = global.nodemodule["fs-extra"];
  const path = require("path");

  const { threadID, messageID, body, senderID } = event;

  if (senderID != handleReply.author) return;

  const choice = parseInt(body);

  if (isNaN(choice) || choice < 1 || choice > handleReply.data.length) {
    return api.sendMessage(
`╭┈ ❒ [ PINAYFLIX ❌ ]
╰┈➤ Reply number (1-${handleReply.data.length})`,
      threadID,
      messageID
    );
  }

  const pick = handleReply.data[choice - 1];

  api.sendMessage(
`╭┈ ❒ [ PINAYFLIX 🎬 ]
╰┈➤ Fetching video...
╰┈➤ Please wait...`,
    threadID,
    async (err, info) => {
      if (err) return;

      try {
       
        const html = (await axios.get(pick.embedURL)).data;

        
        const match = html.match(/file:"(.*?)"/);

        if (!match) {
          return api.editMessage(
`╭┈ ❒ [ PINAYFLIX ❌ ]
╰┈➤ Cannot extract video`,
            info.messageID,
            threadID
          );
        }

        const videoURL = match[1];

        const file = path.join(__dirname, "cache", `pinay_${Date.now()}.mp4`);

       
        const stream = await axios({
          url: videoURL,
          method: "GET",
          responseType: "stream"
        });

        const writer = fs.createWriteStream(file);
        stream.data.pipe(writer);

        writer.on("finish", () => {
          api.editMessage(
`╭┈ ❒ [ PINAYFLIX ✅ ]
╰┈➤ Sending video...`,
            info.messageID,
            threadID
          );

          api.sendMessage(
            {
              body: `🎬 ${pick.title}`,
              attachment: fs.createReadStream(file)
            },
            threadID,
            () => fs.unlinkSync(file),
            messageID
          );
        });

        writer.on("error", () => {
          api.editMessage(
`╭┈ ❒ [ PINAYFLIX ❌ ]
╰┈➤ Download failed`,
            info.messageID,
            threadID
          );
        });

      } catch (e) {
        console.error(e);
        api.editMessage(
`╭┈ ❒ [ PINAYFLIX ❌ ]
╰┈➤ Failed to fetch video`,
          info.messageID,
          threadID
        );
      }
    }
  );
};


module.exports.run = async function({ api, event, args }) {
  const axios = require("axios");

  const { threadID, messageID, senderID } = event;

  const page = args[0] || 1;

  try {
    api.sendMessage(
`╭┈ ❒ [ PINAYFLIX 🎬 ]
╰┈➤ Loading videos...`,
    threadID,
    async (err, info) => {
      if (err) return;

      try {
        const res = await axios.get(
          `https://betadash-api-swordslush-production.up.railway.app/pinayflix?page=${page}`
        );

        const data = res.data.results;

        if (!data || data.length === 0) {
          return api.editMessage(
`╭┈ ❒ [ PINAYFLIX ❌ ]
╰┈➤ No videos found`,
            info.messageID,
            threadID
          );
        }

        let msg =
`╭┈ ❒ [ PINAYFLIX 🎬 ]
╰┈➤ Reply with number (1-4)\n\n`;

        const list = data.slice(0, 4);

        list.forEach((item, i) => {
          msg += `${i + 1}. ${item.title}\n`;
        });

        api.editMessage(msg, info.messageID, threadID);

        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          data: list
        });

      } catch (e) {
        api.editMessage(
`╭┈ ❒ [ PINAYFLIX ❌ ]
╰┈➤ API error`,
          info.messageID,
          threadID
        );
      }
    });

  } catch (e) {
    return api.sendMessage("Error", threadID, messageID);
  }
};