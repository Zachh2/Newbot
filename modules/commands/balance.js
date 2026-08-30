module.exports.config = {
  name: "balance",
  version: "6.0.0",
  credits: "Zycke + ChatGPT",
  hasPermssion: 0,
  description: "Check balance",
  usePrefix: true,
  commandCategory: "economy",
  cooldowns: 2,
  dependencies: { "fs-extra": "" }
};

module.exports.run = async function ({ api, event }) {
  const fs = global.nodemodule["fs-extra"];
  const path = require("path");

  const { threadID, senderID } = event;

  const dataPath = path.join(
    __dirname,
    "..",
    "..",
    "includes",
    "database",
    "data",
    "usersData.json"
  );

  // ✅ SAFE LOAD
  let data = {};
  try {
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, "{}");
    data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch (e) {
    fs.writeFileSync(dataPath, "{}");
    data = {};
  }

  let uid = senderID;
  let isSelf = true;

  if (Object.keys(event.mentions).length > 0) {
    uid = Object.keys(event.mentions)[0];
    isSelf = false;
  } else if (event.type == "message_reply") {
    uid = event.messageReply.senderID;
    isSelf = false;
  }

  // ✅ FULL SAFE INIT (FIX BUG)
  if (!data[uid] || typeof data[uid] !== "object") {
    data[uid] = { money: 0, exp: 0, level: 1 };
  }

  if (typeof data[uid].money !== "number") data[uid].money = 0;

  // save fix if needed
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  const money = data[uid].money;

  // format money
  const format = money.toLocaleString();

  // SELF
  if (isSelf) {
    return api.sendMessage(
`╭┈ ❒ [ BALANCE 🏦 ]
╰┈➤ Your Balance: ${format} 💰`,
      threadID,
      event.messageID
    );
  }

  // OTHER USER
  let name = "User";
  try {
    const userInfo = await api.getUserInfo(uid);
    name = userInfo[uid]?.name || "User";
  } catch {}

  return api.sendMessage(
`╭┈ ❒ [ BALANCE 🏦 ]
╰┈➤ User: ${name}
╰┈➤ Balance: ${format} 💰`,
    threadID,
    event.messageID
  );
};