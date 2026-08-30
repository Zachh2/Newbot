module.exports.config = {
  name: "kick",
  version: "1.0",
  hasPermssion: 1,
  credits: "Jonell Magallanes",
  description: "Kick user from group",
  usePrefix: true,
  commandCategory: "Admin",
  usage: "[kick] [mention or reply] [reason]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;
  
  if (!event.isGroup) {
    const notGroupMsg = await api.sendMessage("❌ | This command can only be used in group chats.", threadID, messageID);
    setTimeout(async () => {
      await api.unsendMessage(notGroupMsg.messageID);
    }, 10000);
    return;
  }

  const threadInfo = await api.getThreadInfo(threadID);
  const adminIDs = threadInfo.adminIDs.map(admin => admin.id);
  
  if (!adminIDs.includes(senderID)) {
    const notAdminMsg = await api.sendMessage("❌ | You need to be an admin to use this command.", threadID, messageID);
    setTimeout(async () => {
      await api.unsendMessage(notAdminMsg.messageID);
    }, 10000);
    return;
  }

  const botID = api.getCurrentUserID();
  if (!adminIDs.includes(botID)) {
    const botNotAdminMsg = await api.sendMessage("❌ | Need Admin Group Chat Privilege", threadID, messageID);
    setTimeout(async () => {
      await api.unsendMessage(botNotAdminMsg.messageID);
    }, 10000);
    return;
  }

  if (args.length === 0 && !messageReply) {
    const usageMsg = await api.sendMessage(`⚠️ 𝗜𝗡𝗩𝗔𝗟𝗜𝗗 𝗨𝗦𝗔𝗚𝗘\n━━━━━━━━━━━━━━━━━━\n📝 𝗨𝘀𝗮𝗴𝗲:\n/kick <mention or reply> <reason>\n/kick <uid> <reason>`, threadID, messageID);
    setTimeout(async () => {
      await api.unsendMessage(usageMsg.messageID);
    }, 10000);
    return;
  }

  let targetUser;
  let reason;
  
  if (Object.keys(mentions).length > 0) {
    targetUser = Object.keys(mentions)[0];
    const mentionText = mentions[targetUser];
    reason = args.join(" ").replace(mentionText, "").trim();
  } else if (messageReply) {
    targetUser = messageReply.senderID;
    reason = args.join(" ").trim();
  } else {
    targetUser = args[0];
    reason = args.slice(1).join(" ").trim();
  }

  if (!targetUser) {
    const noTargetMsg = await api.sendMessage("❌ | Please mention a user or reply to a message to kick.", threadID, messageID);
    setTimeout(async () => {
      await api.unsendMessage(noTargetMsg.messageID);
    }, 10000);
    return;
  }

  if (!reason) reason = "Default You Kicked by The Admins Group Chat";

  if (targetUser === senderID) {
    const selfKickMsg = await api.sendMessage("❌ | You cannot kick yourself.", threadID, messageID);
    setTimeout(async () => {
      await api.unsendMessage(selfKickMsg.messageID);
    }, 10000);
    return;
  }

  if (targetUser === botID) {
    const kickBotMsg = await api.sendMessage("❌ | I cannot kick myself.", threadID, messageID);
    setTimeout(async () => {
      await api.unsendMessage(kickBotMsg.messageID);
    }, 10000);
    return;
  }

  const targetAdminCheck = adminIDs.includes(targetUser);
  if (targetAdminCheck) {
    const adminTargetMsg = await api.sendMessage("❌ | Cannot kick another admin from the group.", threadID, messageID);
    setTimeout(async () => {
      await api.unsendMessage(adminTargetMsg.messageID);
    }, 10000);
    return;
  }

  try {
    const userInfo = await api.getUserInfo(targetUser);
    const userName = userInfo[targetUser]?.name || targetUser;
    const adminInfo = await api.getUserInfo(senderID);
    const adminName = adminInfo[senderID]?.name || "Admin";

api.setMessageReaction("⏱️", event.messageID, () => { }, true);

    await api.removeUserFromGroup(targetUser, threadID);

    const successMsg = await api.sendMessage(`✅ 𝗨𝗦𝗘𝗥 𝗞𝗜𝗖𝗞𝗘𝗗 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟𝗟𝗬\n━━━━━━━━━━━━━━━━━━\n👤 𝗨𝘀𝗲𝗿: ${userName}\n📝 𝗥𝗲𝗮𝘀𝗼𝗻: ${reason}\n👮 𝗞𝗶𝗰𝗸𝗲𝗱 𝗯𝘆: ${adminName}\n━━━━━━━━━━━━━━━━━━\n🗑️ 𝗠𝗲𝘀𝘀𝗮𝗴𝗲𝘀 𝘄𝗶𝗹𝗹 𝗯𝗲 𝗱𝗲𝗹𝗲𝘁𝗲𝗱 𝗶𝗻 𝟱𝘀`, threadID);
    
    try {
      const dmMessage = `🚨 𝗬𝗢𝗨 𝗛𝗔𝗩𝗘 𝗕𝗘𝗘𝗡 𝗞𝗜𝗖𝗞𝗘𝗗\n━━━━━━━━━━━━━━━━━━\n👤 𝗬𝗼𝘂𝗿 𝗡𝗮𝗺𝗲: ${userName}\n📝 𝗥𝗲𝗮𝘀𝗼𝗻: ${reason}\n👮 𝗞𝗶𝗰𝗸𝗲𝗱 𝗯𝘆: ${adminName}\n👥 𝗚𝗿𝗼𝘂𝗽: ${threadInfo.name || "Unknown Group"}\n━━━━━━━━━━━━━━━━━━\n⚠️  𝗬𝗼𝘂 𝗵𝗮𝘃𝗲 𝗯𝗲𝗲𝗻 𝗿𝗲𝗺𝗼𝘃𝗲𝗱 𝗳𝗿𝗼𝗺 𝘁𝗵𝗲 𝗴𝗿𝗼𝘂𝗽`;
      
      await api.sendMessage(dmMessage, targetUser);
    } catch (dmError) {
      console.error("Failed to send DM:", dmError);
    }
    
    setTimeout(async () => {
      try {
        await api.unsendMessage(warningMsg.messageID);
        await api.unsendMessage(successMsg.messageID);
      } catch (error) {
        console.error("Error unsending messages:", error);
      }
    }, 5000);

  } catch (error) {
    console.error("Kick error:", error);
    const errorMsg = await api.sendMessage(`❌ 𝗞𝗜𝗖𝗞 𝗙𝗔𝗜𝗟𝗘𝗗\n━━━━━━━━━━━━━━━━━━\n⚠️  Failed to kick user. Please check if:\n• User exists\n• I have permission to remove members\n• User is not an admin\n━━━━━━━━━━━━━━━━━━\n🗑️ 𝗠𝗲𝘀𝘀𝗮𝗴𝗲 𝘄𝗶𝗹𝗹 𝗯𝗲 𝗱𝗲𝗹𝗲𝘁𝗲𝗱 𝗶𝗻 𝟭𝟬𝘀`, threadID, messageID);
    setTimeout(async () => {
      await api.unsendMessage(errorMsg.messageID);
    }, 10000);
  }
};