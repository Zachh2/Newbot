module.exports.config = {
  name: "brat",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "dev + Zycke fix",
  description: "Generate brat-style video",
  usePrefix: true,
  commandCategory: "media",
  usages: "[text]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const axios = require("axios");
  const fs = global.nodemodule["fs-extra"];
  const path = require("path");

  const { threadID, messageID } = event;

  const text = args.join(" ");

  if (!text) {
    return api.sendMessage(
`╭┈ ❒ [ BRATVID ❌ ]
╰┈➤ Please enter text`,
      threadID,
      messageID
    );
  }

  api.sendMessage(
`╭┈ ❒ [ BRATVID 🎬 ]
╰┈➤ Generating video...
╰┈➤ Please wait...`,
    threadID,
    async (err, info) => {

      const encoded = encodeURIComponent(text);
      const url = `https://api.ferdev.my.id/maker/bratvid?text=${encoded}&apikey=lain-lain`;

      const file = path.join(__dirname, "cache", `brat_${Date.now()}.mp4`);

      try {
        const res = await axios({
          url,
          method: "GET",
          responseType: "stream"
        });

        const writer = fs.createWriteStream(file);
        res.data.pipe(writer);

        writer.on("finish", () => {
          api.editMessage(
`╭┈ ❒ [ BRATVID ✅ ]
╰┈➤ Video generated successfully`,
            info.messageID,
            threadID
          );

          api.sendMessage(
            {
              body: `🎬 Brat video for:\n"${text}"`,
              attachment: fs.createReadStream(file)
            },
            threadID,
            () => fs.unlinkSync(file),
            messageID
          );
        });

        writer.on("error", () => {
          api.editMessage(
`╭┈ ❒ [ BRATVID ❌ ]
╰┈➤ Failed to write file`,
            info.messageID,
            threadID
          );
        });

      } catch (e) {
        console.error("BRATVID ERROR:", e.message);

        api.editMessage(
`╭┈ ❒ [ BRATVID ❌ ]
╰┈➤ Failed to generate video`,
          info.messageID,
          threadID
        );
      }
    }
  );
};