const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "xp-event",
  version: "5.0.0",
  hasPermssion: 0,
  credits: "Zycke",
  description: "XP system synced with usersData.json",
  usePrefix: false,
  hide: true,
  commandCategory: "System",
  cooldowns: 0
};

const dataPath = path.join(
  __dirname,
  "..",
  "..",
  "includes",
  "database",
  "data",
  "usersData.json"
);


function loadData() {
  try {
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, "{}");
    return JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch {
    fs.writeFileSync(dataPath, "{}");
    return {};
  }
}


function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}


function getRank(level) {
  if (level >= 71) return "🔥 Legend";
  if (level >= 41) return "👑 Master";
  if (level >= 21) return "🏆 Elite";
  if (level >= 11) return "⚔️ Pro";
  if (level >= 6) return "🧑 Player";
  return "🐣 Noob";
}

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!event.body || !event.isGroup) return;

    const { senderID, threadID } = event;

    if (!global.messageTracker) global.messageTracker = new Map();

    let track =
      global.messageTracker.get(senderID) || { count: 0, lastGain: 0 };

    track.count++;
    global.messageTracker.set(senderID, track);

    const now = Date.now();

    if (track.count >= 10 && now - track.lastGain >= 5 * 60 * 1000) {
      const xpGain = Math.floor(Math.random() * 70) + 70;

      let data = loadData();

 
      if (!data[senderID] || typeof data[senderID] !== "object") {
        data[senderID] = {
          money: 0,
          exp: 0,
          level: 1
        };
      }

   
      if (typeof data[senderID].money !== "number") data[senderID].money = 0;
      if (typeof data[senderID].exp !== "number") data[senderID].exp = 0;
      if (typeof data[senderID].level !== "number") data[senderID].level = 1;

      let oldLevel = data[senderID].level;

 
      data[senderID].exp += xpGain;

      let leveledUp = false;

     
      while (true) {
        let need = data[senderID].level * 100;

        if (data[senderID].exp < need) break;

        data[senderID].exp -= need;
        data[senderID].level += 1;
        leveledUp = true;
      }

      saveData(data);

   
      track.count = 0;
      track.lastGain = now;
      global.messageTracker.set(senderID, track);

      let name = "User";
      try {
        const userInfo = await api.getUserInfo(senderID);
        name = userInfo[senderID]?.name || "User";
      } catch {}

      const level = data[senderID].level;
      const rank = getRank(level);

     
      api.sendMessage(
        `✨ XP System\n\n🎉 ${name} gained ${xpGain} XP\n📊 Level: ${level}\n🏷️ Rank: ${rank}`,
        threadID
      );

    
      if (leveledUp) {
        api.sendMessage(
          `🎊 LEVEL UP!\n\n👤 ${name}\n⬆️ Level: ${oldLevel} → ${level}\n🏷️ New Rank: ${rank}`,
          threadID
        );
      }
    }
  } catch (err) {
    console.error("XP ERROR:", err);
  }
};

module.exports.run = async () => {};