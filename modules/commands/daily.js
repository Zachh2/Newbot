module.exports.config = {
  name: "daily",
  version: "5.0.0",
  credits: "Zycke",
  hasPermssion: 0,
  description: "Daily reward",
  usePrefix: true,
  commandCategory: "economy",
  cooldowns: 5,
  dependencies: { "fs-extra": "" }
};

module.exports.run = async function({ api, event }) {
  const fs = global.nodemodule["fs-extra"];
  const path = require("path");

  const { threadID, senderID } = event;
  const usersDataPath = path.join(__dirname, "..", "..", "includes", "database", "data", "usersData.json");
  const dailyCachePath = path.join(__dirname, "cache", "daily.json");

  if (!fs.existsSync(usersDataPath)) {
    return api.sendMessage("Database not found", threadID);
  }

  if (!fs.existsSync(path.join(__dirname, "cache"))) {
    fs.mkdirSync(path.join(__dirname, "cache"));
  }

  if (!fs.existsSync(dailyCachePath)) {
    fs.writeFileSync(dailyCachePath, JSON.stringify({}, null, 4));
  }

  let usersData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
  let dailyData = JSON.parse(fs.readFileSync(dailyCachePath, 'utf8'));

  if (!usersData[senderID]) {
    usersData[senderID] = {
      userID: senderID,
      money: 0,
      exp: 0,
      createTime: { timestamp: Date.now() },
      data: { timestamp: Date.now() },
      lastUpdate: Date.now()
    };
  }

  const now = Date.now();
  const cooldown = 24 * 60 * 60 * 1000;

  if (dailyData[senderID] && now - dailyData[senderID] < cooldown) {
    let timeLeft = cooldown - (now - dailyData[senderID]);
    let h = Math.floor(timeLeft / 3600000);
    let m = Math.floor((timeLeft % 3600000) / 60000);

    return api.sendMessage(
`╭┈ ❒ [ DAILY ❌ ]
╰┈➤ Already claimed
╰┈➤ Come back in ${h}h ${m}m`,
      threadID
    );
  }

  const base = Math.floor(Math.random() * 1000) + 1000;
  const bonus = Math.floor(Math.random() * 500) + 200;

  api.sendMessage(`╭┈ ❒ [ DAILY 🎁 ]\n╰┈➤ Claiming reward...`, threadID, (err, info) => {
    setTimeout(() => {
      api.editMessage(`╭┈ ❒ [ DAILY 🎁 ]\n╰┈➤ Preparing reward...\n╰┈➤ Applying bonus...`, info.messageID, threadID);
    }, 1500);

    setTimeout(() => {
      usersData[senderID].money = (usersData[senderID].money || 0) + base + bonus;
      usersData[senderID].lastUpdate = now;
      fs.writeFileSync(usersDataPath, JSON.stringify(usersData, null, 4));

      dailyData[senderID] = now;
      fs.writeFileSync(dailyCachePath, JSON.stringify(dailyData, null, 4));

      api.editMessage(
`╭┈ ❒ [ DAILY REWARD ✅ ]
╰┈➤ Reward: +${base} 💰
╰┈➤ Bonus: +${bonus} From Jonell Bembangan Corporation ✨
╰┈➤ Balance: ${usersData[senderID].money} 🏦`,
        info.messageID,
        threadID
      );
    }, 3000);
  });
};