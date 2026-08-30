const fs = require('fs');
const path = require('path');

const reactFilePath = path.join(__dirname, 'cache', 'autoreact.json');
let autoReact = {};

if (fs.existsSync(reactFilePath)) {
    autoReact = JSON.parse(fs.readFileSync(reactFilePath));
} else {
    fs.writeFileSync(reactFilePath, JSON.stringify(autoReact));
}

module.exports.config = {
    name: "autoreact",
    version: "1.0.0",
    hasPermssion: 0,
    description: "Auto reaction system",
    usePrefix: true,
    hide: false,
    commandCategory: "Utility",
    usages: "[on/off]",
    cooldowns: 2,
    credits: "Jonell Magallanes"
};

module.exports.handleEvent = async function ({ api, event }) {
    if (event.type === "message_reaction") {
        if (!autoReact[event.threadID]) return;
        if (event.senderID === api.getCurrentUserID()) return;
        
        api.setMessageReaction(event.reaction, event.messageID, () => null, true);
    }
};

module.exports.run = async ({ api, event, args }) => {
    const threadId = event.threadID;

    if (!args[0]) {
        const status = autoReact[threadId] ? "🟢 ON" : "🔴 OFF";
        return api.sendMessage(`⚙️ Auto Reaction Status: ${status}\n━━━━━━━━━━━━━━━━━━\nUsage: autoreact on/off`, threadId);
    }

    if (args[0].toLowerCase() === "on") {
        autoReact[threadId] = true;
        updateReactFile();
        api.sendMessage("✅ Auto Reaction has been turned ON for this group.", threadId);
    } else if (args[0].toLowerCase() === "off") {
        delete autoReact[threadId];
        updateReactFile();
        api.sendMessage("❌ Auto Reaction has been turned OFF for this group.", threadId);
    } else {
        api.sendMessage("⚙️ Invalid parameter. Use: autoreact on/off", threadId);
    }
};

function updateReactFile() {
    fs.writeFileSync(reactFilePath, JSON.stringify(autoReact, null, 2));
}