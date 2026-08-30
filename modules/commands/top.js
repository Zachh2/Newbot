module.exports.config = {
  name: "top",
  version: "5.0.0",
  credits: "Zycke (fully fixed)",
  hasPermssion: 0,
  description: "Top richest",
  usePrefix: true,
  commandCategory: "economy",
  cooldowns: 5,
  dependencies: { "fs-extra": "" }
};

// ✅ Infinite formatter
function formatMoney(num) {
  if (!isFinite(num)) return "∞";

  const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  let unitIndex = 0;

  while (num >= 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }

  // if exceeds defined units → infinite
  if (unitIndex >= units.length - 1 && num >= 1000) {
    return "∞";
  }

  return num.toFixed(1).replace(/\.0$/, "") + units[unitIndex];
}

module.exports.run = async function({ api, event }) {
  const fs = global.nodemodule["fs-extra"];
  const path = require("path");
  const { threadID } = event;

  const usersDataPath = path.join(
    __dirname,
    "..",
    "..",
    "includes",
    "database",
    "data",
    "usersData.json"
  );

  // ❌ No database
  if (!fs.existsSync(usersDataPath)) {
    return api.sendMessage("❌ Database not found", threadID);
  }

  // ❌ Broken JSON protection
  let usersData;
  try {
    usersData = JSON.parse(fs.readFileSync(usersDataPath, "utf8"));
  } catch (e) {
    return api.sendMessage("❌ Database corrupted (invalid JSON)", threadID);
  }

  // ✅ Clean + fix money values
  let users = Object.keys(usersData)
    .map(id => {
      let money = Number(usersData[id]?.money);

      // fix invalid values
      if (isNaN(money) || money < 0) money = 0;

      return { id, money };
    })
    .filter(user => user.money > 0)
    .sort((a, b) => b.money - a.money)
    .slice(0, 5); // change/remove if you want more

  if (users.length === 0) {
    return api.sendMessage("❌ No users with money yet", threadID);
  }

  // ⏳ Loading message
  api.sendMessage(
    `╭┈ ❒ [ LEADERBOARD ]\n╰┈➤ Loading top players...`,
    threadID,
    async (err, info) => {
      let msg = "╭┈ ❒ [ TOP MONEY ]\n";

      for (let i = 0; i < users.length; i++) {
        let name = "Unknown";

        try {
          const userInfo = await api.getUserInfo(users[i].id);
          name = userInfo[users[i].id]?.name || "Unknown";
        } catch {
          name = users[i].id;
        }

        const formattedMoney = formatMoney(users[i].money);

        msg += `╰┈➤ ${i + 1}. ${name} - ${formattedMoney} coins\n`;
      }

      setTimeout(() => {
        api.editMessage(msg, info.messageID, threadID);
      }, 1200);
    }
  );
};