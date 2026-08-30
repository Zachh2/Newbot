module.exports.config = { 
  name: "slot",
  version: "16.0.0",
  hasPermssion: 0,
  credits: "Zycke (Final System Fix)",
  description: "Slot (win = no deduct, lose = deduct)",
  usePrefix: true,
  commandCategory: "economy",
  usages: "[bet]",
  cooldowns: 20
};

module.exports.run = async function ({ api, event, args }) {
  const fs = require("fs-extra");
  const path = require("path");

  const { threadID, senderID } = event;
  const file = path.join(__dirname, "..", "..", "includes", "database", "data", "usersData.json");

  if (!global.slotLock) global.slotLock = {};
  if (global.slotLock[senderID]) {
    return api.sendMessage("⏳ Please wait...", threadID);
  }
  global.slotLock[senderID] = true;

  try {
    if (!fs.existsSync(file)) {
      global.slotLock[senderID] = false;
      return api.sendMessage("❌ Database not found", threadID);
    }

    let data = JSON.parse(fs.readFileSync(file, "utf8"));

    if (!data[senderID]) {
      data[senderID] = { money: 0, exp: 0, streak: 0 };
    }

    let user = data[senderID];
    let bet = parseInt(args[0]);

    if (!bet || bet <= 0) {
      global.slotLock[senderID] = false;
      return api.sendMessage("❌ Invalid bet", threadID);
    }

    if ((user.money || 0) < bet) {
      global.slotLock[senderID] = false;
      return api.sendMessage(`❌ Not enough money\n💰 Balance: ${user.money}`, threadID);
    }

    const symbols = ["🍒","🍋","🍉","💎","🍇"];

    let s1, s2, s3;
    let isWin = false;

    // 🎯 Win chance
    if (Math.random() < 0.0) {
      isWin = true;
      let sym = symbols[Math.floor(Math.random() * symbols.length)];
      s1 = s2 = s3 = sym;
    } else {
      do {
        s1 = symbols[Math.floor(Math.random() * symbols.length)];
        s2 = symbols[Math.floor(Math.random() * symbols.length)];
        s3 = symbols[Math.floor(Math.random() * symbols.length)];
      } while (s1 === s2 && s2 === s3);
    }

    // ✅ APPLY RESULT (YOUR SYSTEM)
    if (isWin) {
      user.money += bet * 2;   // 💰 +profit only
    } else {
      user.money -= bet;       // 💸 deduct only on lose
    }

    // prevent negative
    if (user.money < 0) user.money = 0;

    // save
    fs.writeFileSync(file, JSON.stringify(data, null, 2));

    const format = n => n.toLocaleString();

    let display = isWin
      ? `+${format(bet * 2)}`
      : `-${format(bet)}`;

    return api.sendMessage(
`╭─── SLOT ${isWin ? "🎉" : "❌"} ───╮
[ ${s1} | ${s2} | ${s3} ]
${isWin ? "You Win" : "You Lose"}: ${display} 💰
Balance: ${format(user.money)} 🏦
╰──────────────╯`,
      threadID
    );

  } catch (e) {
    console.log(e);
    global.slotLock[senderID] = false;
    return api.sendMessage("❌ Error occurred", threadID);
  } finally {
    global.slotLock[senderID] = false;
  }
};