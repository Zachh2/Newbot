const moment = require("moment-timezone");

module.exports.config = {
  name: "callad",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "Zycke",
  description: "Send report to admins (multi GC + reply)",
  usePrefix: true,
  commandCategory: "system",
  usages: "[message]",
  cooldowns: 5
};


const ADMIN_TIDS = [
  "1130000599101474",
  "1318891403069148"
];

module.exports.run = async function ({ api, event, args, Users }) {

  if (!global.client.handleReply) global.client.handleReply = [];

  if (!args[0]) {
    return api.sendMessage(
      "❌ Please enter a message to report",
      event.threadID,
      event.messageID
    );
  }

  let senderID = event.senderID;
  let message = args.join(" ");

  let name = "Unknown User";
  try {
    name = await Users.getNameUser(senderID);
  } catch (e) {}

  let time = moment.tz("Asia/Manila").format("HH:mm:ss | DD/MM/YYYY");

  let threadName = "Unknown";
  try {
    let info = await api.getThreadInfo(event.threadID);
    threadName = info.threadName || "Unnamed Group";
  } catch (e) {}

  let reportText =
`🚨 NEW REPORT

👤 Name: ${name}
🆔 UID: ${senderID}
💬 Thread: ${threadName}
🧵 TID: ${event.threadID}

📝 Message:
${message}

🕒 Time: ${time}

👉 Reply to this message to respond`;


  for (let tid of ADMIN_TIDS) {
    api.sendMessage(reportText, tid, (err, info) => {

      if (err) {
        console.log("SEND ERROR:", err);
        return;
      }


      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID,
        threadID: event.threadID,
        type: "admin_reply"
      });

    });
  }

  return api.sendMessage(
`📨 Report sent to admins!

📝 ${message}
🕒 ${time}`,
    event.threadID,
    event.messageID
  );
};




module.exports.handleReply = async function ({ api, event, handleReply }) {

  if (event.senderID == handleReply.author) return;

  let replyMsg = event.body;
  if (!replyMsg) return;

  api.sendMessage(
`📩 Admin Reply:

${replyMsg}`,
    handleReply.threadID,
    (err, info) => {

      if (!err) {

        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: handleReply.author,
          threadID: handleReply.threadID,
          type: "user_reply"
        });
      }

    },
    handleReply.messageID
  );
};