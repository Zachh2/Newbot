module.exports.config = {
  name: "citybillboard",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "zzach + Zycke fix",
  description: "Put user on billboard",
  usePrefix: true,
  commandCategory: "fun",
  usages: "@user / reply / uid",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const axios = require("axios");
  const fs = global.nodemodule["fs-extra"];
  const path = require("path");

  const { threadID, messageID, senderID } = event;

  // 🔍 TARGET DETECT
  let uid;
  if (Object.keys(event.mentions).length > 0) {
    uid = Object.keys(event.mentions)[0];
  } else if (event.type == "message_reply") {
    uid = event.messageReply.senderID;
  } else if (args[0]) {
    uid = args[0];
  } else {
    return api.sendMessage(
`╭┈ ❒ [ BILLBOARD ❌ ]
╰┈➤ Please mention, reply or input UID`,
      threadID,
      messageID
    );
  }

  try {
    const info = await api.getUserInfo(uid);
    const name = info[uid]?.name || "Someone";

    // 🎬 START MESSAGE
    api.sendMessage(
`╭┈ ❒ [ BILLBOARD 🏙️ ]
╰┈➤ Creating billboard...`,
    threadID,
    (err, msg) => {
      if (err) return;

      const mid = msg.messageID;

      // 🐢 NORMAL SPEED PROGRESS
      setTimeout(() => {
        api.editMessage(
`╭┈ ❒ [ BILLBOARD 🏙️ ]
╰┈➤ Processing...
╰┈➤ 50% complete`,
        mid,
        threadID
        );
      }, 1500);

      setTimeout(async () => {
        try {
          const file = path.join(__dirname, "cache", `billboard_${Date.now()}.jpg`);

          const res = await axios({
            url: `https://betadash-api-swordslush-production.up.railway.app/city-billboard?userid=${uid}`,
            method: "GET",
            responseType: "stream"
          });

          const writer = fs.createWriteStream(file);
          res.data.pipe(writer);

          writer.on("finish", () => {
            api.editMessage(
`╭┈ ❒ [ BILLBOARD ✅ ]
╰┈➤ ${name} is now on billboard!`,
            mid,
            threadID
            );

            api.sendMessage(
              {
                body: `🏙️ ${name} is now on the city billboard!`,
                attachment: fs.createReadStream(file)
              },
              threadID,
              () => fs.unlinkSync(file),
              messageID
            );

            // ❌ remove progress msg after
            setTimeout(() => {
              api.unsendMessage(mid).catch(()=>{});
            }, 4000);
          });

          writer.on("error", () => {
            api.editMessage(
`╭┈ ❒ [ BILLBOARD ❌ ]
╰┈➤ Failed to write file`,
            mid,
            threadID
            );
          });

        } catch (e) {
          console.error(e);
          api.editMessage(
`╭┈ ❒ [ BILLBOARD ❌ ]
╰┈➤ Failed to generate`,
          mid,
          threadID
          );
        }
      }, 3000);
    });

  } catch (e) {
    console.error(e);
    return api.sendMessage(
`╭┈ ❒ [ BILLBOARD ❌ ]
╰┈➤ Error occurred`,
      threadID,
      messageID
    );
  }
};