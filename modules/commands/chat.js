const fs = require('fs');
const path = require('path');

const chatFilePath = path.join(__dirname, '.../database/chatRestrict.json');

let chat = {};

if (!fs.existsSync(chatFilePath)) {
    const dir = path.dirname(chatFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(chatFilePath, JSON.stringify({}), 'utf8');
} else {
    chat = JSON.parse(fs.readFileSync(chatFilePath, 'utf8'));
}

module.exports.config = {
    name: "chat",
    version: "1.0.0",
    hasPermssion: 1,
    description: "Chat restriction for non-admins",
    usePrefix: true,
    hide: false,
    commandCategory: "System",
    usages: "/chat on | /chat off",
    cooldowns: 2,
    credits: "Jonell Magallanes"
};

module.exports.handleEvent = async function({ api, event, actions }) {
    const threadID = String(event.threadID);
    if (!chat[threadID]) return;

    const botID = api.getCurrentUserID();
    if (event.senderID === botID) return;

    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === event.senderID);
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);

    if (!isAdmin && isBotAdmin) {
        const id = event.senderID;
        const getInfo = global.getUser(id);
        const username = getInfo.name || "Facebook User";
        await actions.kick(id);
        await actions.send(
            `🔒 𝗨𝗦𝗘𝗥 𝗥𝗘𝗠𝗢𝗩𝗘𝗗\n━━━━━━━━━━━━━━━━━━\n❌ ${username} has been auto-removed due to chat restrictions.\n━━━━━━━━━━━━━━━━━━\n🛡️ Chat Restriction System`,
            threadID
        );
    }
};

module.exports.run = async function({ api, event, actions, target }) {
    const threadID = String(event.threadID);
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === event.senderID);

    if (!isAdmin) {
        return actions.reply(
            `⛔ 𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗\n━━━━━━━━━━━━━━━━━━\nOnly group admins can manage chat restrictions.\n━━━━━━━━━━━━━━━━━━`
        );
    }

    const action = target[0]?.toLowerCase();

    if (action === 'off') {
        chat[threadID] = true;
        fs.writeFileSync(chatFilePath, JSON.stringify(chat, null, 2), 'utf8');
        return actions.reply(
            `🔒 𝗖𝗛𝗔𝗧 𝗥𝗘𝗦𝗧𝗥𝗜𝗖𝗧𝗘𝗗\n━━━━━━━━━━━━━━━━━━\n🛑 Non-admins will now be removed if they chat.\n━━━━━━━━━━━━━━━━━━\n📢 Use '/chat on' to unlock chat.`
        );
    } else if (action === 'on') {
        chat[threadID] = false;
        fs.writeFileSync(chatFilePath, JSON.stringify(chat, null, 2), 'utf8');
        return actions.reply(
            `✅ 𝗖𝗛𝗔𝗧 𝗨𝗡𝗟𝗢𝗖𝗞𝗘𝗗\n━━━━━━━━━━━━━━━━━━\n💬 All members can now chat freely.\n━━━━━━━━━━━━━━━━━━\n📢 Use '/chat off' to restrict.`
        );
    } else {
        return actions.reply(
            `❓ 𝗨𝗦𝗔𝗚𝗘\n━━━━━━━━━━━━━━━━━━\n📍 Use '/chat on' to allow chatting or '/chat off' to restrict.\n━━━━━━━━━━━━━━━━━━\n⚙️ Chat Control`
        );
    }
};