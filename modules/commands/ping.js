module.exports.config = {
  name: "ping",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Mirai Team + Zycke fix",
  description: "Tag all members",
  usePrefix: true,
  commandCategory: "group",
  usages: "[text]",
  cooldowns: 1
};

module.exports.run = async function({ api, event, args }) {
  try {
    const { threadID, messageID, senderID, participantIDs } = event;

    const botID = api.getCurrentUserID();

    
    const listUser = participantIDs.filter(id => id != botID);

    let msgText = args.join(" ") || "📢 Attention everyone!";

    let mentions = [];
    let body = "";

    
    for (let i = 0; i < listUser.length; i++) {
      body += `‎${msgText}\n`;
      mentions.push({
        id: listUser[i],
        tag: "‎",
        fromIndex: body.length - msgText.length - 1
      });
    }

    return api.sendMessage(
      {
        body:
`╭┈ ❒ [ PING 📢 ]
╰┈➤ Calling all members...\n\n${body}`,
        mentions
      },
      threadID,
      messageID
    );

  } catch (e) {
    console.error(e);
    return api.sendMessage(
`╭┈ ❒ [ PING ❌ ]
╰┈➤ Failed to tag members`,
      event.threadID,
      event.messageID
    );
  }
};