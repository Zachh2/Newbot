const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "topexp",
  version: "6.0.0",
  credits: "Zycke",
  hasPermssion: 0,
  description: "Top EXP leaderboard (like topmoney)",
  usePrefix: true,
  commandCategory: "economy",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID } = event;

  const dataPath = path.join(
    __dirname,
    "..",
    "..",
    "includes",
    "database",
    "data",
    "usersData.json"
  );

 
  let data = {};
  try {
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, "{}");
    data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch {
    fs.writeFileSync(dataPath, "{}");
    data = {};
  }

  
  let users = Object.keys(data).map(uid => {
    let user = data[uid];

    if (!user || typeof user !== "object") {
      user = { exp: 0, level: 1 };
    }

    if (typeof user.exp !== "number") user.exp = 0;
    if (typeof user.level !== "number") user.level = 1;

    return {
      id: uid,
      exp: user.exp,
      level: user.level
    };
  });


  users.sort((a, b) => b.exp - a.exp);

  users = users.slice(0, 10);


  api.sendMessage(
    `╭┈ ❒ [ LEADERBOARD ]\n╰┈➤ Loading top players...`,
    threadID,
    async (err, info) => {

      let msg = "╭┈ ❒ [ TOP EXP ]\n";

      for (let i = 0; i < users.length; i++) {
        let name = "Unknown";

        try {
        
          const userInfo = await api.getUserInfo(users[i].id);
          name = userInfo[users[i].id]?.name || "Unknown";
        } catch {
          name = "Unknown";
        }

        msg += `╰┈➤ ${i + 1}. ${name}\n`;
        msg += `     📊 Level: ${users[i].level}\n`;
        msg += `     ✨ EXP: ${users[i].exp.toLocaleString()}\n`;
      }

      setTimeout(() => {
        api.editMessage(msg, info.messageID, threadID);
      }, 1200);
    }
  );
};