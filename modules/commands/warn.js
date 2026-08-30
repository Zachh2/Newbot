const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "warn",
  version: "1.0",
  hasPermssion: 1,
  credits: "Jonell Magallanes",
  description: "Warn system for group management",
  usePrefix: true,
  commandCategory: "Admin",
  usage: "[warn] [clear] [list]",
  cooldowns: 5
};

const warnPath = path.join(__dirname, 'warnData.json');

function loadWarnData() {
  try {
    if (!fs.existsSync(warnPath)) {
      const defaultData = {};
      fs.writeFileSync(warnPath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    return JSON.parse(fs.readFileSync(warnPath, 'utf8'));
  } catch (error) {
    return {};
  }
}

function saveWarnData(data) {
  try {
    fs.writeFileSync(warnPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    return false;
  }
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;
  
  if (!event.isGroup) {
    return api.sendMessage("❌ | This command can only be used in group chats.", threadID, messageID);
  }

  const threadInfo = await api.getThreadInfo(threadID);
  const adminIDs = threadInfo.adminIDs.map(admin => admin.id);
  
  if (!adminIDs.includes(senderID)) {
    return api.sendMessage("❌ | You need to be an admin to use this command.", threadID, messageID);
  }

  const warnData = loadWarnData();
  if (!warnData[threadID]) {
    warnData[threadID] = {};
  }

  const action = args[0];

  if (!action) {
    return api.sendMessage(`⚠️ | Invalid usage!\n━━━━━━━━━━━━━━━━━━\n📝 | Usage:\n/warn <mention or reply> <reason>\n/warn clear <mention or uid>\n/warn list`, threadID, messageID);
  }

  if (action === 'list') {
    const threadWarns = warnData[threadID];
    const warnedUsers = Object.keys(threadWarns);
    
    if (warnedUsers.length === 0) {
      return api.sendMessage("📝 | No users have been warned in this group.", threadID, messageID);
    }

    let listMessage = "📋 𝗪𝗔𝗥𝗡 𝗟𝗜𝗦𝗧\n━━━━━━━━━━━━━━━━━━\n";
    
    for (const userID of warnedUsers) {
      try {
        const userInfo = await api.getUserInfo(userID);
        const userName = userInfo[userID]?.name || userID;
        const warnCount = threadWarns[userID].count;
        const lastReason = threadWarns[userID].lastReason;
        
        listMessage += `👤 𝗨𝘀𝗲𝗿: ${userName}\n⚠️ 𝗪𝗮𝗿𝗻𝘀: ${warnCount}\n📝 𝗟𝗮𝘀𝘁 𝗥𝗲𝗮𝘀𝗼𝗻: ${lastReason}\n━━━━━━━━━━━━━━━━━━\n`;
      } catch (error) {
        listMessage += `👤 𝗨𝘀𝗲𝗿: ${userID}\n⚠️ 𝗪𝗮𝗿𝗻𝘀: ${threadWarns[userID].count}\n📝 𝗟𝗮𝘀𝘁 𝗥𝗲𝗮𝘀𝗼𝗻: ${threadWarns[userID].lastReason}\n━━━━━━━━━━━━━━━━━━\n`;
      }
    }

    return api.sendMessage(listMessage, threadID, messageID);
  }

  if (action === 'clear') {
    const targetUser = args[1];
    
    if (!targetUser) {
      return api.sendMessage("❌ | Please mention a user or provide UID to clear warns.", threadID, messageID);
    }

    let userID;
    
    if (Object.keys(mentions).length > 0) {
      userID = Object.keys(mentions)[0];
    } else if (messageReply) {
      userID = messageReply.senderID;
    } else {
      userID = targetUser;
    }

    if (!warnData[threadID][userID]) {
      return api.sendMessage("❌ | This user has no warnings to clear.", threadID, messageID);
    }

    delete warnData[threadID][userID];
    
    if (saveWarnData(warnData)) {
      try {
        const userInfo = await api.getUserInfo(userID);
        const userName = userInfo[userID]?.name || userID;
        return api.sendMessage(`✅ | Successfully cleared all warnings for ${userName}`, threadID, messageID);
      } catch (error) {
        return api.sendMessage(`✅ | Successfully cleared all warnings for ${userID}`, threadID, messageID);
      }
    } else {
      return api.sendMessage("❌ | Failed to clear warnings.", threadID, messageID);
    }
  }

  if (action === 'warn' || !['clear', 'list'].includes(action)) {
    let targetUser;
    let reason;
    
    if (Object.keys(mentions).length > 0) {
      targetUser = Object.keys(mentions)[0];
      reason = args.slice(1).join(" ").replace(mentions[targetUser], "").trim();
    } else if (messageReply) {
      targetUser = messageReply.senderID;
      reason = args.slice(1).join(" ").trim();
    } else {
      targetUser = args[1];
      reason = args.slice(2).join(" ").trim();
    }

    if (!targetUser) {
      return api.sendMessage("❌ | Please mention a user or reply to a message to warn.", threadID, messageID);
    }

    if (!reason) reason = "No reason provided";

    if (!warnData[threadID][targetUser]) {
      warnData[threadID][targetUser] = {
        count: 0,
        lastReason: "",
        history: []
      };
    }

    warnData[threadID][targetUser].count += 1;
    warnData[threadID][targetUser].lastReason = reason;
    warnData[threadID][targetUser].history.push({
      reason: reason,
      timestamp: new Date().toISOString(),
      warnedBy: senderID
    });

    const warnCount = warnData[threadID][targetUser].count;

    if (saveWarnData(warnData)) {
      try {
        const userInfo = await api.getUserInfo(targetUser);
        const userName = userInfo[targetUser]?.name || targetUser;
        
        const warnMessage = `⚠️ 𝗪𝗔𝗥𝗡 𝗦𝗬𝗦𝗧𝗘𝗠\n━━━━━━━━━━━━━━━━━━\n👤 𝗨𝘀𝗲𝗿: ${userName}\n⚠️ 𝗪𝗮𝗿𝗻 𝗖𝗼𝘂𝗻𝘁: ${warnCount}\n📝 𝗥𝗲𝗮𝘀𝗼𝗻: ${reason}\n━━━━━━━━━━━━━━━━━━\n💡 𝗡𝗼𝘁𝗲: 3 warnings will result in automatic removal from group.`;
        
        api.sendMessage(warnMessage, threadID, messageID);
        
        if (warnCount >= 3) {
          try {
            await api.removeUserFromGroup(targetUser, threadID);
            
            const kickMessage = `🚨 𝗨𝗦𝗘𝗥 𝗥𝗘𝗠𝗢𝗩𝗘𝗗\n━━━━━━━━━━━━━━━━━━\n👤 𝗨𝘀𝗲𝗿: ${userName}\n❌ 𝗥𝗲𝗮𝘀𝗼𝗻: Reached ${warnCount} warnings\n📝 𝗟𝗮𝘀𝘁 𝗪𝗮𝗿𝗻: ${reason}\n━━━━━━━━━━━━━━━━━━\n⚠️  𝗔𝘂𝘁𝗼𝗺𝗮𝘁𝗶𝗰𝗮𝗹𝗹𝘆 𝗿𝗲𝗺𝗼𝘃𝗲𝗱 𝗳𝗿𝗼𝗺 𝗴𝗿𝗼𝘂𝗽`;
            
            api.sendMessage(kickMessage, threadID, messageID);
            
            delete warnData[threadID][targetUser];
            saveWarnData(warnData);
            
          } catch (kickError) {
            api.sendMessage(`❌ | Failed to remove ${userName} from group. The user might be the group admin or I don't have permission to remove members.`, threadID, messageID);
          }
        } else if (warnCount === 2) {
          api.sendMessage(`🚨 | Warning: ${userName} has 2 warnings! One more warning will result in automatic removal from the group.`, threadID, messageID);
        }
      } catch (error) {
        const warnMessage = `⚠️ 𝗪𝗔𝗥𝗡 𝗦𝗬𝗦𝗧𝗘𝗠\n━━━━━━━━━━━━━━━━━━\n👤 𝗨𝘀𝗲𝗿: ${targetUser}\n⚠️ 𝗪𝗮𝗿𝗻 𝗖𝗼𝘂𝗻𝘁: ${warnCount}\n📝 𝗥𝗲𝗮𝘀𝗼𝗻: ${reason}\n━━━━━━━━━━━━━━━━━━\n💡 𝗡𝗼𝘁𝗲: 3 warnings will result in automatic removal from group.`;
        
        api.sendMessage(warnMessage, threadID, messageID);
        
        if (warnCount >= 3) {
          try {
            await api.removeUserFromGroup(targetUser, threadID);
            
            const kickMessage = `🚨 𝗨𝗦𝗘𝗥 𝗥𝗘𝗠𝗢𝗩𝗘𝗗\n━━━━━━━━━━━━━━━━━━\n👤 𝗨𝘀𝗲𝗿: ${targetUser}\n❌ 𝗥𝗲𝗮𝘀𝗼𝗻: Reached ${warnCount} warnings\n📝 𝗟𝗮𝘀𝘁 𝗪𝗮𝗿𝗻: ${reason}\n━━━━━━━━━━━━━━━━━━\n⚠️  𝗔𝘂𝘁𝗼𝗺𝗮𝘁𝗶𝗰𝗮𝗹𝗹𝘆 𝗿𝗲𝗺𝗼𝘃𝗲𝗱 𝗳𝗿𝗼𝗺 𝗴𝗿𝗼𝘂𝗽`;
            
            api.sendMessage(kickMessage, threadID, messageID);
            
            delete warnData[threadID][targetUser];
            saveWarnData(warnData);
            
          } catch (kickError) {
            api.sendMessage(`❌ | Failed to remove ${targetUser} from group. The user might be the group admin or I don't have permission to remove members.`, threadID, messageID);
          }
        } else if (warnCount === 2) {
          api.sendMessage(`🚨 | Warning: ${targetUser} has 2 warnings! One more warning will result in automatic removal from the group.`, threadID, messageID);
        }
      }
    } else {
      api.sendMessage("❌ | Failed to save warn data.", threadID, messageID);
    }
  }
};