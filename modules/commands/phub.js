module.exports.config = {
  name: "phub",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "MewMew + Zycke fix",
  description: "Comment on phub style",
  usePrefix: true,
  commandCategory: "edit-img",
  usages: "phub [text]",
  cooldowns: 15,
  dependencies: {
    "canvas": "",
    "axios": "",
    "fs-extra": ""
  }
};

// ✅ WRAP TEXT
module.exports.wrapText = async (ctx, text, maxWidth) => {
  if (ctx.measureText(text).width < maxWidth) return [text];

  const words = text.split(" ");
  const lines = [];
  let line = "";

  for (let word of words) {
    const testLine = line + word + " ";
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = testLine;
    }
  }

  if (line) lines.push(line.trim());
  return lines;
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const fs = global.nodemodule["fs-extra"];
  const path = require("path");
  const axios = require("axios");
  const { loadImage, createCanvas } = require("canvas");

  if (!args[0]) {
    return api.sendMessage(
`╭┈ ❒ [ PHUB ❌ ]
╰┈➤ Please enter comment text`,
      threadID,
      messageID
    );
  }

  const text = args.join(" ");

  // 📁 PATHS
  const avatarPath = path.join(__dirname, "cache", `${senderID}_avt.png`);
  const outputPath = path.join(__dirname, "cache", `${senderID}_phub.png`);

  try {
    // 👤 GET USER INFO (ONLY ONCE)
    const userInfo = await api.getUserInfo(senderID);
    const name = userInfo[senderID].name;
    const avatarURL = userInfo[senderID].thumbSrc;

    // ⬇️ DOWNLOAD
    const avatarData = (await axios.get(avatarURL, { responseType: "arraybuffer" })).data;
    const baseData = (await axios.get(
      "https://raw.githubusercontent.com/ProCoderMew/Module-Miraiv2/main/data/phub.png",
      { responseType: "arraybuffer" }
    )).data;

    fs.writeFileSync(avatarPath, avatarData);
    fs.writeFileSync(outputPath, baseData);

    // 🎨 CANVAS
    const avatar = await loadImage(avatarPath);
    const base = await loadImage(outputPath);

    const canvas = createCanvas(base.width, base.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(base, 0, 0);
    ctx.drawImage(avatar, 30, 310, 70, 70);

    // 👤 NAME
    ctx.font = "700 23px Arial";
    ctx.fillStyle = "#FF9900";
    ctx.fillText(name, 115, 350);

    // 💬 TEXT
    ctx.font = "400 23px Arial";
    ctx.fillStyle = "#FFFFFF";

    const lines = await module.exports.wrapText(ctx, text, 1160);

    let y = 430;
    for (let line of lines) {
      ctx.fillText(line, 30, y);
      y += 30;
    }

    // 💾 SAVE
    fs.writeFileSync(outputPath, canvas.toBuffer());

    return api.sendMessage(
      {
        body: `╭┈ ❒ [ PHUB 📸 ]\n╰┈➤ Here's your comment`,
        attachment: fs.createReadStream(outputPath)
      },
      threadID,
      () => {
        fs.unlinkSync(outputPath);
        fs.unlinkSync(avatarPath);
      },
      messageID
    );

  } catch (err) {
    console.error(err);
    return api.sendMessage(
`╭┈ ❒ [ PHUB ❌ ]
╰┈➤ Error while generating image`,
      threadID,
      messageID
    );
  }
};