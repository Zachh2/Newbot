module.exports.config = {
  name: "setmoney",
  version: "1.0.0",
  credits: "Zycke",
  hasPermssion: 2,
  description: "Set money or exp for user",
  usePrefix: true,
  commandCategory: "admin",
  cooldowns: 5,
  dependencies: { "fs-extra": "" }
};

module.exports.run = async function({ api, event, args }) {
  const fs = global.nodemodule["fs-extra"];
  const path = require("path");

  const { threadID, senderID } = event;
  const usersDataPath = path.join(__dirname, "..", "..", "includes", "database", "data", "usersData.json");

  if (!fs.existsSync(usersDataPath)) {
    return api.sendMessage("Database not found", threadID);
  }

  let usersData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));

  if (!args[0]) {
    return api.sendMessage(
`╭┈ ❒ [ SETMONEY/SETEXP ]
╰┈➤ Usage:
╰┈➤ setmoney money <amount> @mention
╰┈➤ setmoney exp <amount> @mention
╰┈➤ setmoney money 1000 @user
╰┈➤ setmoney exp 500 reply to message`,
      threadID
    );
  }

  let type = args[0].toLowerCase();
  let amount = parseInt(args[1]);
  let uid = null;

  if (type !== "money" && type !== "exp") {
    return api.sendMessage("❌ Invalid type! Use 'money' or 'exp'", threadID);
  }

  if (!amount || isNaN(amount) || amount < 0) {
    return api.sendMessage("❌ Invalid amount! Enter a valid number", threadID);
  }

  if (Object.keys(event.mentions).length > 0) {
    uid = Object.keys(event.mentions)[0];
  } else if (event.type == "message_reply") {
    uid = event.messageReply.senderID;
  } else if (args[2]) {
    uid = args[2];
  }

  if (!uid) {
    return api.sendMessage("❌ User not found! Mention, reply, or provide user ID", threadID);
  }

  if (!usersData[uid]) {
    usersData[uid] = {
      userID: uid,
      money: 0,
      exp: 0,
      createTime: { timestamp: Date.now() },
      data: { timestamp: Date.now() },
      lastUpdate: Date.now()
    };
  }

  let oldValue = usersData[uid][type];
  usersData[uid][type] = amount;
  usersData[uid].lastUpdate = Date.now();

  fs.writeFileSync(usersDataPath, JSON.stringify(usersData, null, 4));

  let name = uid;
  let adminName = "Admin";
  
  try {
    let userInfo = await api.getUserInfo(uid);
    name = userInfo[uid].name;
  } catch (err) {
    name = uid;
  }

  try {
    let adminInfo = await api.getUserInfo(senderID);
    adminName = adminInfo[senderID].name;
  } catch (err) {
    adminName = "Admin";
  }

  return api.sendMessage(
`╭┈ ❒ [ ADMIN SET ${type.toUpperCase()} ✅ ]
╰┈➤ User: ${name}
╰┈➤ ${type.toUpperCase()}: ${oldValue} → ${amount}
╰┈➤ Updated by: ${adminName}`,
    threadID
  );
};