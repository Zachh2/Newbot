module.exports.config = {
  name: "countmem",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "BerVer + Zycke fix",
  description: "Count group stats",
  usePrefix: true,
  commandCategory: "group",
  usages: "message/admin/member/male/female/other/allgroup/alluser",
  cooldowns: 5
};

module.exports.run = async function({ api, Threads, Users, event, args }) {
  const { threadID, messageID } = event;

  const input = args[0]?.toLowerCase();

  const threadInfo = await api.getThreadInfo(threadID);

  let male = 0, female = 0, other = 0;

  for (let user of threadInfo.userInfo) {
    if (user.gender == "MALE") male++;
    else if (user.gender == "FEMALE") female++;
    else other++;
  }

  const box = await Threads.getAll(['threadID']);
  const users = await Users.getAll(['userID']);

  // ❌ NO INPUT
  if (!input) {
    return api.sendMessage(
`╭┈ ❒ [ COUNT ❌ ]
╰┈➤ Please choose:
╰┈➤ message/admin/member/male/female/other/allgroup/alluser`,
      threadID,
      messageID
    );
  }

  // 📊 SWITCH SYSTEM (CLEAN)
  let msg = "";

  switch (input) {
    case "message":
      msg = `💬 Messages: ${threadInfo.messageCount}`;
      break;

    case "admin":
      msg = `👑 Admins: ${threadInfo.adminIDs.length}`;
      break;

    case "member":
      msg = `👥 Members: ${threadInfo.participantIDs.length}`;
      break;

    case "male":
      msg = `👨 Male: ${male}`;
      break;

    case "female":
      msg = `👩 Female: ${female}`;
      break;

    case "other":
    case "gei":
      msg = `🏳️ Other: ${other}`;
      break;

    case "allgroup":
      msg = `🏘️ Total Groups: ${box.length}`;
      break;

    case "alluser":
      msg = `👤 Total Users: ${users.length}`;
      break;

    default:
      msg = `❌ Invalid option`;
  }

  return api.sendMessage(
`╭┈ ❒ [ COUNT 📊 ]
╰┈➤ ${msg}`,
    threadID,
    messageID
  );
};