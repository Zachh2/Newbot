const fs = require('fs');
const path = require('path');

// Random quotes array
const randomQuotes = [
    "Knowledge is power.",
    "Simplicity is the ultimate sophistication.",
    "Code is like humor. When you have to explain it, it’s bad.",
    "Stay hungry, stay foolish."
];
const randomQuote = randomQuotes[Math.floor(Math.random() * randomQuotes.length)];

module.exports.config = {
    name: "help",
    hasPermssion: 0,
    version: "1.0.0",
    credits: "zach",
    description: "Beginner's guide",
    usePrefix: true,
    commandCategory: "System",
    usages: "[command name] or [all] or [page number]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args, prefix }) {
    try {
        const commandsPath = __dirname;
        const files = fs.readdirSync(commandsPath);
        const commandFiles = files.filter(file => file.endsWith('.js') && file !== 'help.js');

        const commands = [];

        for (const file of commandFiles) {
            try {
                const command = require(path.join(commandsPath, file));
                if (command.config && command.config.name) {
                    commands.push({
                        name: command.config.name,
                        description: command.config.description || "No description",
                        usages: command.config.usages || "No usage specified",
                        version: command.config.version || "1.0.0",
                        credits: command.config.credits || "Unknown",
                        category: command.config.commandCategory || "General",
                        cooldown: command.config.cooldowns || 5
                    });
                }
            } catch (error) {
                console.log(`Skipping ${file}: ${error.message}`);
            }
        }

        if (commands.length === 0) {
            return api.sendMessage("❌ No commands found.", event.threadID, event.messageID);
        }

        commands.sort((a, b) => a.name.localeCompare(b.name));

        // Default: show page 1
        if (!args[0]) {
            const page = 1;
            const perPage = 10;
            const totalPages = Math.ceil(commands.length / perPage);
            const start = (page - 1) * perPage;
            const end = start + perPage;
            const pageCommands = commands.slice(start, end);

            let helpText = `𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗟𝗜𝗦𝗧\n━━━━━━━━━━━━━━━\n`;
            pageCommands.forEach((cmd, i) => {
                helpText += `\n╭┈ ❒ [ ${prefix} ] : 𝙋𝙍𝙀𝙁𝙄𝙓\n╰   ⁞ ❏. ${start + i + 1}: ${cmd.name}\n   📝 ${cmd.description}\n━━━━━━━━━━━━━━━\n`;
            });

            helpText += `\n𝗣𝗮𝗴𝗲: 『${page}/${totalPages}』\n`;
            helpText += `🔢 Use: ${prefix}help <page> (1-${totalPages})\n`;
            helpText += `📜 Use: ${prefix}help all\n`;
            helpText += `ℹ️ Use: ${prefix}help <command>\n\n`;
            helpText += `💡 Random Fact: ${randomQuote}`;

            return api.sendMessage(helpText, event.threadID, event.messageID);
        }

        // Page navigation
        if (!isNaN(args[0])) {
            const page = parseInt(args[0]);
            const perPage = 10;
            const totalPages = Math.ceil(commands.length / perPage);

            if (page < 1 || page > totalPages) {
                return api.sendMessage(`❌ Invalid page. Available: 1-${totalPages}`, event.threadID, event.messageID);
            }

            const start = (page - 1) * perPage;
            const end = start + perPage;
            const pageCommands = commands.slice(start, end);

            let helpText = `𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗟𝗜𝗦𝗧\n━━━━━━━━━━━━━━━\n`;
            pageCommands.forEach((cmd, i) => {
                helpText += `\n╭┈ ❒ [ ${prefix} ] : 𝙋𝙍𝙀𝙁𝙄𝙓\n╰   ⁞ ❏. ${start + i + 1}: ${cmd.name}\n   📝 ${cmd.description}\n━━━━━━━━━━━━━━━\n`;
            });

            helpText += `\n𝗣𝗮𝗴𝗲: 『${page}/${totalPages}』\n`;
            helpText += `ℹ️ Use: ${prefix}help <command>\n\n`;
            helpText += `💡 Random Fact: ${randomQuote}`;

            return api.sendMessage(helpText, event.threadID, event.messageID);
        }

        // Command details
        if (args[0].toLowerCase() !== 'all') {
            const cmdName = args[0].toLowerCase();
            const command = commands.find(c => c.name.toLowerCase() === cmdName);

            if (command) {
                let info = ` 「 Command 」\n\n`;
                info += `➛ Name: ${command.name}\n`;
                info += `➛ Version: ${command.version}\n`;
                info += `➛ Category: ${command.category}\n`;
                info += `➛ Description: ${command.description}\n`;
                info += `➛ Usage: ${prefix}${command.usages}\n`;
                info += `➛ Credits: ${command.credits}\n`;
                info += `➛ Cooldown: ${command.cooldown} second(s)\n\n`;
                info += `💡 Random Fact: ${randomQuote}`;

                return api.sendMessage(info, event.threadID, event.messageID);
            } else {
                return api.sendMessage(`❌ Command "${args[0]}" not found.`, event.threadID, event.messageID);
            }
        }

        // Show all commands
        if (args[0].toLowerCase() === 'all') {
            let helpText = `𝗔𝗟𝗟 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦\n━━━━━━━━━━━━━━━\n`;
            commands.forEach((cmd, i) => {
                helpText += `\n╭┈ ❒ [ ${prefix} ] : 𝙋𝙍𝙀𝙁𝙄𝙓\n╰   ⁞ ❏. ${i + 1}: ${cmd.name}\n   📝 ${cmd.description}\n━━━━━━━━━━━━━━━\n`;
            });

            helpText += `\n📋 Total Commands: ${commands.length}\n`;
            helpText += `ℹ️ Use: ${prefix}help <command>\n\n`;
            helpText += `💡 Random Fact: ${randomQuote}`;

            return api.sendMessage(helpText, event.threadID, event.messageID);
        }

    } catch (error) {
        console.error(error);
        api.sendMessage("❌ Error loading help.", event.threadID, event.messageID);
    }
};
