const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

module.exports.config = {
    name: "antirobbery",
    eventType: ["log:thread-admins", "log:thread-name", "log:thread-image"],
    version: "1.0.0",
    credits: "Your Name",
    description: "Group protection system against unauthorized changes"
};

const PROTECTION_FILE = path.join(__dirname, '../database/antirobbery.json');

const loadProtectionData = () => {
    if (!fs.existsSync(PROTECTION_FILE)) {
        const dir = path.dirname(PROTECTION_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(PROTECTION_FILE, '{}', 'utf8');
        return {};
    }
    return JSON.parse(fs.readFileSync(PROTECTION_FILE, 'utf8'));
};

const saveProtectionData = (data) => {
    const dir = path.dirname(PROTECTION_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PROTECTION_FILE, JSON.stringify(data, null, 2), 'utf8');
};

const downloadImage = async (url, filename) => {
    const res = await axios.get(url, { responseType: 'stream' });
    const imagePath = path.join(__dirname, `../database/${filename}`);
    const writer = fs.createWriteStream(imagePath);
    res.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(imagePath));
        writer.on('error', reject);
    });
};

module.exports.run = async function({ api, event }) {
    const { logMessageType, logMessageData } = event;
    const protectionData = loadProtectionData();
    const threadID = event.threadID;

    if (!protectionData[threadID]) protectionData[threadID] = {};
    const threadData = protectionData[threadID];

    const info = await api.getThreadInfo(threadID);
    const isAdmin = id => info.adminIDs?.some(a => a.id === id);

    if (!threadData.originalName) {
        threadData.originalName = info.threadName;
        if (info.imageSrc) {
            const savedImage = await downloadImage(info.imageSrc, `image_${threadID}.jpg`);
            threadData.originalImage = savedImage;
        }
        saveProtectionData(protectionData);
    }

    if (!threadData.guard) return;

    if (logMessageType === "log:thread-admins") {
        if (event.author === api.getCurrentUserID()) return;
        if (logMessageData.TARGET_ID === api.getCurrentUserID()) return;

        try {
            if (logMessageData.ADMIN_EVENT === "add_admin") {
                await api.changeAdminStatus(threadID, event.author, false);
                await api.changeAdminStatus(threadID, logMessageData.TARGET_ID, false);
                api.sendMessage(
                    "🛡️ 𝗔𝗡𝗧𝗜-𝗥𝗢𝗕𝗕𝗘𝗥𝗬 𝗔𝗖𝗧𝗜𝗩𝗘\n━━━━━━━━━━━━━━━━━━\n❌ Unauthorized admin promotion detected!\n🧹 Both users demoted.\n━━━━━━━━━━━━━━━━━━",
                    threadID
                );
            } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
                await api.changeAdminStatus(threadID, event.author, false);
                await api.changeAdminStatus(threadID, logMessageData.TARGET_ID, true);
                api.sendMessage(
                    "🛡️ 𝗔𝗡𝗧𝗜-𝗥𝗢𝗕𝗕𝗘𝗥𝗬 𝗔𝗖𝗧𝗨𝗩𝗘\n━━━━━━━━━━━━━━━━━━\n❌ An admin was removed without permission!\n✅ Admin restored.\n━━━━━━━━━━━━━━━━━━",
                    threadID
                );
            }
        } catch (error) {}
    }

    if (!threadData.nameWarnings) threadData.nameWarnings = {};
    if (logMessageType === "log:thread-name") {
        if (event.author === api.getCurrentUserID()) return;
        if (logMessageData.NAME !== threadData.originalName) {
            await api.setTitle(threadData.originalName, threadID);
            if (!isAdmin(event.author)) {
                threadData.nameWarnings[event.author] = (threadData.nameWarnings[event.author] || 0) + 1;
                saveProtectionData(protectionData);

                if (threadData.nameWarnings[event.author] >= 2) {
                    delete threadData.nameWarnings[event.author];
                    saveProtectionData(protectionData);
                    await api.removeUserFromGroup(event.author, threadID);
                    api.sendMessage(
                        "🛡️ 𝗔𝗡𝗧𝗜-𝗥𝗢𝗕𝗕𝗘𝗥𝗬 𝗡𝗔𝗠𝗘 𝗚𝗨𝗔𝗥𝗗\n━━━━━━━━━━━━━━━━━━\n❌ Group name changed twice without permission!\n⏪ Name restored and user removed.\n━━━━━━━━━━━━━━━━━━",
                        threadID
                    );
                } else {
                    api.sendMessage(
                        `⚠️ 𝗪𝗔𝗥𝗡𝗜𝗡𝗚 𝗡𝗔𝗠𝗘 𝗚𝗨𝗔𝗥𝗗\n━━━━━━━━━━━━━━━━━━\n⚠️ Group name change attempt ${threadData.nameWarnings[event.author]}/2 detected!\n⏪ Name has been restored.\n━━━━━━━━━━━━━━━━━━`,
                        threadID
                    );
                }
            }
        }
    }

    if (logMessageType === "log:thread-image") {
        if (event.author === api.getCurrentUserID()) return;
        if (threadData.originalImage) {
            await api.changeGroupImage(fs.createReadStream(threadData.originalImage), threadID);
            if (!isAdmin(event.author)) {
                await api.removeUserFromGroup(event.author, threadID);
                api.sendMessage(
                    "🛡️ 𝗔𝗡𝗧𝗜-𝗥𝗢𝗕𝗕𝗘𝗥𝗬 𝗣𝗜𝗖 𝗣𝗥𝗢𝗧𝗘𝗖𝗧\n━━━━━━━━━━━━━━━━━━\n❌ Group image changed unauthorized!\n⏪ Image restored and user kicked.\n━━━━━━━━━━━━━━━━━━",
                    threadID
                );
            }
        }
    }

    saveProtectionData(protectionData);
};