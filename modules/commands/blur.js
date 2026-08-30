module.exports.config = {
  name: "blur",
  version: "5.2.0",
  hasPermssion: 0,
  credits: "Zycke",
  description: "Blur avatar (Popcat v2)",
  usePrefix: true,
  commandCategory: "edit-img",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");

  let uid;

  // ✅ MENTION LOOP (FIXED)
  for (const id in event.mentions) {
    uid = id;
    break;
  }

  if (!uid) {
    uid = event.type === "message_reply"
      ? event.messageReply.senderID
      : senderID;
  }

  const file = path.join(__dirname, "cache", `blur_${Date.now()}.png`);

  try {
    const userInfo = await api.getUserInfo(uid);
    let avatarURL = userInfo[uid].thumbSrc;

    if (!avatarURL || avatarURL.includes("safe_image.php")) {
      avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;
    }

    const res = await axios.get(
      `https://api.popcat.xyz/v2/blur?image=${encodeURIComponent(avatarURL)}`,
      { responseType: "arraybuffer" }
    );

    fs.writeFileSync(file, res.data);

    return api.sendMessage(
      {
        attachment: fs.createReadStream(file)
      },
      threadID,
      () => fs.unlinkSync(file),
      messageID
    );

  } catch (err) {
    console.error("PBLUR ERROR:", err.message);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
};