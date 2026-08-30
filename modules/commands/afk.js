const fs = require('fs');
const path = require('path');

const afkFilePath = path.join(__dirname, 'cache', 'afk.json');
let afkUsers = {};

if (fs.existsSync(afkFilePath)) {
    afkUsers = JSON.parse(fs.readFileSync(afkFilePath));
} else {
    fs.writeFileSync(afkFilePath, JSON.stringify(afkUsers));
}

module.exports.config = {
    name: "afk",
    version: "1.2.0",
    hasPermssion: 0,
    description: "Set or remove AFK status",
    usePrefix: true,
    hide: false,
    commandCategory: "Utility",
    usages: "[reason]",
    cooldowns: 2,
    credits: "Jonell Magallanes"
};

module.exports.handleEvent = async function ({ api, event }) {
    if (!event.isGroup || !event.body) return;

    const senderId = event.senderID.toString();

    if (afkUsers[senderId]) {
        delete afkUsers[senderId];
        updateAfkFile();
        api.sendMessage(
            `✅ 𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝗕𝗮𝗰𝗸\n━━━━━━━━━━━━━━━━━━\nYou are no longer AFK.`,
            event.threadID,
            event.messageID
        );
        return;
    }

    if (event.mentions) {
        for (const uid of Object.keys(event.mentions)) {
            if (afkUsers[uid]) {
                const { reason, time } = afkUsers[uid];
                api.sendMessage(
                    `💤 𝗨𝘀𝗲𝗿 𝗔𝗙𝗞\n━━━━━━━━━━━━━━━━━━\n${await getUserName(api, uid)} is currently AFK.\nReason: ${reason}\nSince: ${formatPHTime(time)}`,
                    event.threadID,
                    event.messageID
                );
            }
        }
    }

    if (event.messageReply && afkUsers[event.messageReply.senderID]) {
        const repliedId = event.messageReply.senderID;
        const { reason, time } = afkUsers[repliedId];
        api.sendMessage(
            `💤 𝗨𝘀𝗲𝗿 𝗔𝗙𝗞\n━━━━━━━━━━━━━━━━━━\n${await getUserName(api, repliedId)} is currently AFK.\nReason: ${reason}\nSince: ${formatPHTime(time)}`,
            event.threadID,
            event.messageID
        );
    }
};

module.exports.run = async ({ api, event, args }) => {
    const senderId = event.senderID.toString();
    const reason = args.length > 0 ? args.join(" ") : "No reason provided";

    afkUsers[senderId] = {
        reason,
        time: Date.now()
    };
    updateAfkFile();

    api.sendMessage(
        `💤 𝗬𝗼𝘂 𝗮𝗿𝗲 𝗻𝗼𝘄 𝗔𝗙𝗞\n━━━━━━━━━━━━━━━━━━\nReason: ${reason}\nSince: ${formatPHTime(Date.now())}`,
        event.threadID,
        event.messageID
    );
};

function updateAfkFile() {
    fs.writeFileSync(afkFilePath, JSON.stringify(afkUsers, null, 2));
}

async function getUserName(api, uid) {
    const info = await api.getUserInfo(uid);
    return info[uid]?.name || "User";
}

function formatPHTime(timestamp) {
    return new Date(timestamp).toLocaleString("en-PH", { timeZone: "Asia/Manila" });
}