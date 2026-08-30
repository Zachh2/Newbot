module.exports.config = {
  name: "flip",
  version: "5.0.0",
  credits: "Zycke (10% Win + EXP)",
  hasPermssion: 0,
  description: "Flip coin (10% win + EXP)",
  usePrefix: true,
  commandCategory: "game",
  cooldowns: 20,
  dependencies: { "fs-extra": "" }
};

module.exports.run = async function({ api, event, args }) {
  const fs = global.nodemodule["fs-extra"];
  const path = require("path");

  const { threadID, senderID } = event;
  const file = path.join(__dirname, "..", "..", "includes", "database", "data", "usersData.json");

  if (!fs.existsSync(file)) 
    return api.sendMessage("❌ Database not found", threadID);

  let data = JSON.parse(fs.readFileSync(file, "utf8"));

  if (!data[senderID]) data[senderID] = { money: 0, exp: 0 };
  if (!data[senderID].exp) data[senderID].exp = 0;

  let choice = args[0]?.toLowerCase();
  let bet = parseInt(args[1]);

  if (!choice || !bet)
    return api.sendMessage("❌ Use: flip heads 100", threadID);

  if (choice !== "heads" && choice !== "tails")
    return api.sendMessage("❌ Choose heads or tails", threadID);

  if (bet <= 0)
    return api.sendMessage("❌ Invalid bet", threadID);

  if ((data[senderID].money || 0) < bet)
    return api.sendMessage("❌ Not enough money", threadID);

  // 💸 Deduct
  data[senderID].money -= bet;

  // 🎯 10% WIN SYSTEM
  let isWin = Math.random() < 0.1;

  let result;
  if (isWin) {
    result = choice;
  } else {
    result = choice === "heads" ? "tails" : "heads";
  }

  // 💰 Reward
  let reward = isWin ? bet * 3 : 0;
  data[senderID].money += reward;

  // ⭐ EXP
  let expGain = 0;
  if (isWin) {
    expGain = Math.floor(Math.random() * 100) + 1;
    data[senderID].exp += expGain;
  }

  fs.writeFileSync(file, JSON.stringify(data, null, 2));

  const format = n => n.toLocaleString();

  let display = isWin
    ? `+${format(reward - bet)}`
    : `-${format(bet)}`;

  let expText = isWin ? `\n╰┈➤ 🎉 You received: ${expGain} EXP ⭐` : "";

  return api.sendMessage(
`╭┈ ❒ [ FLIP ]
╰┈➤ You: ${choice}
╰┈➤ Result: ${result}
╰┈➤ ${isWin ? "🎉 Win" : "❌ Lose"}: ${display} 💰${expText}
╰┈➤ Balance: ${format(data[senderID].money)} 🏦`,
  threadID
  );
};