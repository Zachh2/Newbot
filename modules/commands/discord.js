module.exports.config = {
  name: "discord",
  version: "1.4.0",
  hasPermssion: 0,
  credits: "Zycke",
  description: "Discord message generator",
  usePrefix: true,
  commandCategory: "edit-img",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");

  let uid = null;
  let mentionName = "";

  // ✅ MENTION LOOP
  for (const id in event.mentions) {
    uid = id;
    mentionName = event.mentions[id];
    break;
  }

  if (!uid) uid = senderID;

  // 🔥 REMOVE COMMAND NAME FROM TEXT
  let text = event.body.split(" ").slice(1).join(" ");

  // REMOVE MENTION NAME FROM TEXT
  if (mentionName) {
    text = text.replace(mentionName, "").trim();
  }

  // ❌ NO TEXT
  if (!text) {
    return api.sendMessage(
      "Please provide message text",
      threadID,
      messageID
    );
  }

  const file = path.join(__dirname, "cache", `discord_${Date.now()}.png`);

  try {
    const userInfo = await api.getUserInfo(uid);
    const name = userInfo[uid].name;

    let avatarURL = userInfo[uid].thumbSrc;

    if (!avatarURL || avatarURL.includes("safe_image.php")) {
      avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;
    }

    const res = await axios.get(
      `https://api.popcat.xyz/v2/discord-message?username=${encodeURIComponent(name)}&content=${encodeURIComponent(text)}&avatar=${encodeURIComponent(avatarURL)}&color=%23ffcc99&timestamp=${encodeURIComponent(new Date().toISOString())}`,
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
    console.error("DISCORD ERROR:", err.message);

    if (fs.existsSync(file)) fs.unlinkSync(file);

    return api.sendMessage(
      "Failed to generate message",
      threadID,
      messageID
    );
  }
};