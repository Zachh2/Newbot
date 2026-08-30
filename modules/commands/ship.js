module.exports.config = {
  name: "ship",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Zycke",
  description: "Ship two users 💖",
  usePrefix: true,
  commandCategory: "fun",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");

  let uids = [];

  // ✅ GET ALL MENTIONS
  for (const id in event.mentions) {
    uids.push(id);
  }

  let user1, user2;

  // 🎯 LOGIC
  if (uids.length >= 2) {
    user1 = uids[0];
    user2 = uids[1];
  } else if (uids.length === 1) {
    user1 = senderID;
    user2 = uids[0];
  } else if (event.type === "message_reply") {
    user1 = senderID;
    user2 = event.messageReply.senderID;
  } else {
    return api.sendMessage(
      "Please mention 1 or 2 users or reply to someone",
      threadID,
      messageID
    );
  }

  const file = path.join(__dirname, "cache", `ship_${Date.now()}.png`);

  try {
    // 👤 GET USER INFO
    const userInfo = await api.getUserInfo([user1, user2]);

    let avatar1 = userInfo[user1].thumbSrc;
    let avatar2 = userInfo[user2].thumbSrc;

    // ⚠️ FIX FB BLOCK
    if (!avatar1 || avatar1.includes("safe_image.php")) {
      avatar1 = `https://graph.facebook.com/${user1}/picture?width=512&height=512`;
    }

    if (!avatar2 || avatar2.includes("safe_image.php")) {
      avatar2 = `https://graph.facebook.com/${user2}/picture?width=512&height=512`;
    }

    // 💖 POPCAT SHIP API
    const res = await axios.get(
      `https://api.popcat.xyz/v2/ship?user1=${encodeURIComponent(avatar1)}&user2=${encodeURIComponent(avatar2)}`,
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
    console.error("SHIP ERROR:", err.message);

    if (fs.existsSync(file)) fs.unlinkSync(file);

    return api.sendMessage(
      "Failed to process ship image",
      threadID,
      messageID
    );
  }
};