const fs = require('fs-extra');

const path = require('path');

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

module.exports.config = {

    name: "gp",

    version: "1.0.0",

    hasPermssion: 2,

    description: "Group Protection (anti-robbery, admin, name, and image guard)",

    usePrefix: true,

    hide: false,

    commandCategory: "System",

    usages: "/gp on | /gp off",

    cooldowns: 2,

    credits: "Jonell Magallanes"

};

module.exports.run = async ({ api, event, args }) => {

    const threadID = event.threadID;

    const protectionData = loadProtectionData();

    if (!protectionData[threadID]) protectionData[threadID] = {};

    const threadData = protectionData[threadID];

    const subCommand = args[0] ? args[0].toLowerCase() : "";

    if (subCommand === "on") {

        threadData.guard = true;

        saveProtectionData(protectionData);

        api.sendMessage(

            "🛡️ 𝗚𝗥𝗢𝗨𝗣 𝗣𝗥𝗢𝗧𝗘𝗖𝗧𝗜𝗢𝗡 𝗘𝗡𝗔𝗕𝗟𝗘𝗗\n━━━━━━━━━━━━━━━━━━\n✅ Anti-Admin Change Protection\n✅ Anti-Name Change Protection\n✅ Anti-Image Change Protection\n━━━━━━━━━━━━━━━━━━\nAll security measures are now active!",

            threadID

        );

    } else if (subCommand === "off") {

        threadData.guard = false;

        saveProtectionData(protectionData);

        api.sendMessage(

            "🛡️ 𝗚𝗥𝗢𝗨𝗣 𝗣𝗥𝗢𝗧𝗘𝗖𝗧𝗜𝗢𝗡 𝗗𝗜𝗦𝗔𝗕𝗟𝗘𝗗\n━━━━━━━━━━━━━━━━━━\n❌ Anti-Admin Change Protection\n❌ Anti-Name Change Protection\n❌ Anti-Image Change Protection\n━━━━━━━━━━━━━━━━━━\nAll security measures are now turned off!",

            threadID

        );

    } else if (subCommand === "status") {

        const status = threadData.guard ? "🟢 ACTIVE" : "🔴 INACTIVE";

        api.sendMessage(

            `🛡️ 𝗚𝗥𝗢𝗨𝗣 𝗣𝗥𝗢𝗧𝗘𝗖𝗧𝗜𝗢𝗡 𝗦𝗧𝗔𝗧𝗨𝗦\n━━━━━━━━━━━━━━━━━━\n📊 Status: ${status}\n\nUsage: /gp on - Turn on protection\n/gp off - Turn off protection\n/gp status - Check current status`,

            threadID

        );

    } else {

        api.sendMessage(

            "🛡️ 𝗚𝗥𝗢𝗨𝗣 𝗣𝗥𝗢𝗧𝗘𝗖𝗧𝗜𝗢𝗡 𝗦𝗬𝗦𝗧𝗘𝗠\n━━━━━━━━━━━━━━━━━━\nUsage: /gp on - Turn on protection\n/gp off - Turn off protection\n/gp status - Check current status\n━━━━━━━━━━━━━━━━━━\n📋 Features:\n• Anti-Admin Change\n• Anti-Name Change\n• Anti-Image Change",

            threadID

        );

    }

};