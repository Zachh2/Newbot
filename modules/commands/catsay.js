var dek = "Deku";

module.exports.config = {
  name: "catsay",
  version: "3.0.0",
  hasPermssion: 0,
  credits: `${dek} + Zycke fix`,
  description: "Cat says your message",
  usePrefix: true,
  commandCategory: "edit-img",
  usages: "text",
  cooldowns: 20
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  const fs = global.nodemodule["fs-extra"];
  const axios = require("axios");
  const path = require("path");

  const text = args.join(" ");

  if (!text) {
    return api.sendMessage(
`╭┈ ❒ [ CATSAY ❌ ]
╰┈➤ Please enter text`,
      threadID,
      messageID
    );
  }

  const file = path.join(__dirname, "cache", `catsay_${Date.now()}.png`);

  try {
    const encoded = encodeURIComponent(text);

    // 🔥 REQUEST IMAGE
    const res = await axios.get(
      `https://cataas.com/cat/says/${encoded}?json=false`,
      {
        responseType: "arraybuffer",
        timeout: 10000
      }
    );

    // ❗ VALIDATE DATA
    if (!res || !res.data || res.data.length < 10) {
      throw new Error("Invalid image data");
    }

    // 💾 SAVE DIRECTLY (NO Buffer.from!)
    fs.writeFileSync(file, res.data);

    // ❗ CHECK FILE EXISTS
    if (!fs.existsSync(file)) {
      throw new Error("File not saved");
    }

    return api.sendMessage(
      {
        body:
`╭┈ ❒ [ CATSAY 🐱 ]
╰┈➤ "${text}"`,
        attachment: fs.createReadStream(file)
      },
      threadID,
      () => fs.unlinkSync(file),
      messageID
    );

  } catch (e) {
    console.error("CATSAY ERROR:", e.message);

    return api.sendMessage(
`╭┈ ❒ [ CATSAY ❌ ]
╰┈➤ Failed to fetch cat image`,
      threadID,
      messageID
    );
  }
};