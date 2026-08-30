module.exports.config = {
  name: "supreme",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Zycke",
  description: "Generate Supreme logo",
  usePrefix: true,
  commandCategory: "edit-img",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");

  // ❌ NO TEXT
  if (!args[0]) {
    return api.sendMessage(
      "Please enter text",
      threadID,
      messageID
    );
  }

  const text = args.join(" ");
  const file = path.join(__dirname, "cache", `supreme_${Date.now()}.png`);

  try {
    // 🔥 POPCAT SUPREME
    const res = await axios.get(
      `https://api.popcat.xyz/v2/supreme?text=${encodeURIComponent(text)}`,
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
    console.error("SUPREME ERROR:", err.message);

    if (fs.existsSync(file)) fs.unlinkSync(file);

    return api.sendMessage(
      "Failed to generate image",
      threadID,
      messageID
    );
  }
};