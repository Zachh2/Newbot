module.exports.config = {
  name: "work",
  version: "6.0.0",
  credits: "Zycke",
  hasPermssion: 0,
  description: "Work to earn money",
  usePrefix: true,
  commandCategory: "economy",
  cooldowns: 10,
  dependencies: { "fs-extra": "" }
};

module.exports.run = async function({ api, event }) {
  const fs = global.nodemodule["fs-extra"];
  const path = require("path");

  const { threadID, senderID } = event;
  const usersDataPath = path.join(__dirname, "..", "..", "includes", "database", "data", "usersData.json");
  const workCachePath = path.join(__dirname, "cache", "work.json");

  if (!fs.existsSync(usersDataPath)) {
    return api.sendMessage("Database not found", threadID);
  }

  // 📁 ensure cache folder
  if (!fs.existsSync(path.join(__dirname, "cache"))) {
    fs.mkdirSync(path.join(__dirname, "cache"));
  }

  // 📁 ensure work.json
  if (!fs.existsSync(workCachePath)) {
    fs.writeFileSync(workCachePath, JSON.stringify({}, null, 4));
  }

  let usersData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
  let workData = JSON.parse(fs.readFileSync(workCachePath, 'utf8'));

  // 👤 create user
  if (!usersData[senderID]) {
    usersData[senderID] = {
      userID: senderID,
      money: 0,
      exp: 0,
      lastUpdate: Date.now()
    };
  }

  const now = Date.now();

  // ⏱ 10 MINUTES COOLDOWN
  const cooldown = 10 * 60 * 1000;

  if (workData[senderID] && now - workData[senderID] < cooldown) {
    let timeLeft = cooldown - (now - workData[senderID]);
    let min = Math.floor(timeLeft / 60000);
    let sec = Math.floor((timeLeft % 60000) / 1000);

    return api.sendMessage(
`╭┈ ❒ [ WORK ❌ ]
╰┈➤ You already worked
╰┈➤ Come back in ${min}m ${sec}s`,
      threadID
    );
  }

  const jobs = ["👨‍💻 Developer", "🚗 Driver", "🍳 Chef", "🏗️ Builder", "🎥 Streamer"];
  const job = jobs[Math.floor(Math.random() * jobs.length)];

  // 💰 2000 - 5000 REWARD
  const amount = Math.floor(Math.random() * 3001) + 2000;

  api.sendMessage(`╭┈ ❒ [ WORK 💼 ]\n╰┈➤ Starting job...`, threadID, (err, info) => {

    if (err) return;

    setTimeout(() => {
      api.editMessage(
        `╭┈ ❒ [ WORK 💼 ]\n╰┈➤ Working hard...\n╰┈➤ Please wait...`,
        info.messageID,
        threadID
      );
    }, 1500);

    setTimeout(() => {
      try {
        usersData[senderID].money = (usersData[senderID].money || 0) + amount;
        usersData[senderID].lastUpdate = now;

        fs.writeFileSync(usersDataPath, JSON.stringify(usersData, null, 4));

        workData[senderID] = now;
        fs.writeFileSync(workCachePath, JSON.stringify(workData, null, 4));

        api.editMessage(
`╭┈ ❒ [ WORK COMPLETE ✅ ]
╰┈➤ Job: ${job}
╰┈➤ Earned: +${amount} coins 💰
╰┈➤ Balance: ${usersData[senderID].money} coins 🏦`,
          info.messageID,
          threadID
        );

      } catch (e) {
        console.log("Work Error:", e);
        api.sendMessage("❌ Error saving data", threadID);
      }

    }, 3000);
  });
};