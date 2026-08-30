const fs = require('fs');
const path = require('path');
const now = new Date();

const optionsTime = {
  timeZone: 'Asia/Manila',
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
};

const optionsDate = {
  timeZone: 'Asia/Manila',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
};

const optionsDay = {
  timeZone: 'Asia/Manila',
  weekday: 'long'
};

const time = now.toLocaleTimeString('en-GB', optionsTime);
const date = now.toLocaleDateString('en-GB', optionsDate);
const day = now.toLocaleDateString('en-US', optionsDay);


module.exports.config = {
    name: "help",
    hasPermssion: 0,
    version: "1.0.0",
    credits: "Jonell Magallanes",
    description: "Show available commands",
    usePrefix: true,
    commandCategory: "System",
    usages: "[command name] or [all] or [page number]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    try {
        const commandsPath = __dirname;
        const files = fs.readdirSync(commandsPath);
        const commandFiles = files.filter(file => file.endsWith('.js') && file !== 'help.js');
        
        const commands = [];
        
        for (const file of commandFiles) {
            try {
                const command = require(path.join(commandsPath, file));
                if (command.config && command.config.name && command.config.description) {
                    commands.push({
                        name: command.config.name,
                        description: command.config.description,
                        usages: command.config.usages || 'No usage specified',
                        version: command.config.version || '1.0.0',
                        credits: command.config.credits || 'Unknown',
                        category: command.config.commandCategory || 'General',
                        cooldown: command.config.cooldowns || 5
                    });
                }
            } catch (error) {
                console.log(`Skipping file ${file}:`, error.message);
                continue;
            }
        }

        if (commands.length === 0) {
            return api.sendMessage("❌ No commands found in the commands directory.", event.threadID, event.messageID);
        }

        commands.sort((a, b) => a.name.localeCompare(b.name));

        // If no args or just "help" - show page 1 by default
        if (!args[0] || args[0].toLowerCase() === 'help') {
            const page = 1;
            const commandsPerPage = 10;
            const totalPages = Math.ceil(commands.length / commandsPerPage);
            const startIndex = (page - 1) * commandsPerPage;
            const endIndex = startIndex + commandsPerPage;
            const pageCommands = commands.slice(startIndex, endIndex);

           let helpText = `= 𝘽𝙊𝙏 𝘾𝙊𝙈𝙈𝘼𝙉𝘿 𝙇𝙄𝙎𝙏 =

 ━━━━━━༺༻━━━━━━
╭┈ ❒ 𝗨𝘀𝗲: ${global.config.PREFIX}
╰┈➤ this prefix to run this commands
━━━━━━༺༻━━━━━━
`;

pageCommands.forEach((cmd, index) => {
    helpText += `
━━━━━━━━━━━━
╭┈ ❒「 ${startIndex + index + 1} 」➪ ${cmd.name}
╰┈➤ 𝘋𝘦𝘴𝘤𝘳𝘪𝘱𝘵𝘪𝘰𝘯: ${cmd.description}
╰┈➤ 𝘞𝘢𝘪𝘵𝘪𝘯𝘨 𝘛𝘐𝘮𝘦: ${cmd.cooldown}s
╰┈➤ 𝘊𝘢𝘵𝘦𝘨𝘰𝘳𝘺: ${cmd.category}
━━━━━━━━━━━━
`;
});

helpText += `
━━━━━━༺༻━━━━━━
[ 🕜 TIME ]
${day} || ${date} || ${time}

𝙏𝙝𝙞𝙨 𝘽𝙤𝙩 𝙈𝙖𝙙𝙚 𝙗𝙮: 𝘡𝘢𝘤𝘩
`;

            helpText += `━━━━━━━━━━━━━━━━━━━━━━\n`;
            helpText += `📋 𝗧𝗼𝘁𝗮𝗹 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: ${commands.length}\n`;
            helpText += `🔢 𝗨𝘀𝗲: ${global.config.PREFIX}help <page> (1-${totalPages})\n`;
            helpText += `📜 𝗨𝘀𝗲: ${global.config.PREFIX}help all\n`;
            helpText += `ℹ️  𝗨𝘀𝗲: ${global.config.PREFIX}help <command>`;

            return api.sendMessage(helpText, event.threadID, event.messageID);
        }

        if (args[0] && !isNaN(args[0])) {
            const page = parseInt(args[0]);
            const commandsPerPage = 10;
            const totalPages = Math.ceil(commands.length / commandsPerPage);
            
            if (page < 1 || page > totalPages) {
                return api.sendMessage(`❌ Invalid page number. Available pages: 1-${totalPages}`, event.threadID, event.messageID);
            }

            const startIndex = (page - 1) * commandsPerPage;
            const endIndex = startIndex + commandsPerPage;
            const pageCommands = commands.slice(startIndex, endIndex);

           let helpText = `= 𝘽𝙊𝙏 𝘾𝙊𝙈𝙈𝘼𝙉𝘿 𝙇𝙄𝙎𝙏 =

 ━━━━━━༺༻━━━━━━
╭┈ ❒ 𝗨𝘀𝗲: ${global.config.PREFIX}
╰┈➤ this prefix to run this commands
━━━━━━༺༻━━━━━━
`;

pageCommands.forEach((cmd, index) => {
    helpText += `
━━━━━━━━━━━━
╭┈ ❒「 ${startIndex + index + 1} 」➪ ${cmd.name}
╰┈➤ 𝘋𝘦𝘴𝘤𝘳𝘪𝘱𝘵𝘪𝘰𝘯: ${cmd.description}
╰┈➤ 𝘞𝘢𝘪𝘵𝘪𝘯𝘨 𝘛𝘐𝘮𝘦: ${cmd.cooldown}s
╰┈➤ 𝘊𝘢𝘵𝘦𝘨𝘰𝘳𝘺: ${cmd.category}
━━━━━━━━━━━━
`;
});

helpText += `
━━━━━━༺༻━━━━━━
[ 🕜 TIME ]
${day} || ${date} || ${time}

𝙏𝙝𝙞𝙨 𝘽𝙤𝙩 𝙈𝙖𝙙𝙚 𝙗𝙮: 𝘡𝘢𝘤𝘩
`;

            helpText += `━━━━━━━━━━━━━━━━━━━━━━\n`;
            helpText += `📋 𝗧𝗼𝘁𝗮𝗹 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: ${commands.length}\n`;
            helpText += `🔢 𝗨𝘀𝗲: ${global.config.PREFIX}help <page> (1-${totalPages})\n`;
            helpText += `ℹ️  𝗨𝘀𝗲: ${global.config.PREFIX}help <command> for details`;

            return api.sendMessage(helpText, event.threadID, event.messageID);
        }

        if (args[0] && args[0].toLowerCase() !== 'all') {
            const cmdName = args[0].toLowerCase();
            const command = commands.find(cmd => cmd.name && cmd.name.toLowerCase() === cmdName);
            
            if (command) {
                const commandInfo = `🔍 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗜𝗡𝗙𝗢\n`;
                commandInfo += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
                commandInfo += `📛 𝗡𝗮𝗺𝗲: ${command.name}\n`;
                commandInfo += `📖 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: ${command.description}\n`;
                commandInfo += `🔧 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆: ${command.category}\n`;
                commandInfo += `🔄 𝗩𝗲𝗿𝘀𝗶𝗼𝗻: ${command.version}\n`;
                commandInfo += `👤 𝗖𝗿𝗲𝗱𝗶𝘁𝘀: ${command.credits}\n`;
                commandInfo += `⏱️ 𝗖𝗼𝗼𝗹𝗱𝗼𝘄𝗻: ${command.cooldown}s\n`;
                commandInfo += `💡 𝗨𝘀𝗮𝗴𝗲: ${global.config.PREFIX}${command.usages}\n\n`;
                commandInfo += `━━━━━━━━━━━━━━━━━━━━━━`;

                return api.sendMessage(commandInfo, event.threadID, event.messageID);
            } else {
                return api.sendMessage(`❌ Command "${args[0]}" not found. Use "${global.config.PREFIX}help 1" to see available commands.`, event.threadID, event.messageID);
            }
        }

        if (args[0] && args[0].toLowerCase() === 'all') {
            let helpText = `📖 𝗔𝗟𝗟 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦\n`;
            helpText += '━━━━━━━━━━━━━━━━━━━━━━\n\n';

            commands.forEach((cmd, index) => {
                helpText += `🔹 ${index + 1}. ${cmd.name}\n   📝 ${cmd.description}\n\n`;
            });

            helpText += `━━━━━━━━━━━━━━━━━━━━━━\n`;
            helpText += `📋 𝗧𝗼𝘁𝗮𝗹 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: ${commands.length}\n`;
            helpText += `ℹ️  𝗨𝘀𝗲: ${global.config.PREFIX}help <command> for details`;

            return api.sendMessage(helpText, event.threadID, event.messageID);
        }
        
    } catch (error) {
        console.error(error);
        api.sendMessage("❌ An error occurred while loading commands.", event.threadID, event.messageID);
    }
};