module.exports.config = {
    name: "note",
    hasPermssion: 2,
    version: "1.0.0",
    credits: "Jonell Magallanes",
    description: "Manage Facebook Messenger notes",
    usePrefix: true,
    commandCategory: "Utility",
    usages: "[create/delete/check] [text]",
    cooldowns: 10,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const action = args[0]?.toLowerCase();

    if (!action) {
        return api.sendMessage(
            "📝 𝗡𝗢𝗧𝗘 𝗖𝗢𝗠𝗠𝗔𝗡𝗗\n━━━━━━━━━━━━━━━━━━\n📌 Usage:\n• note create [text]\n• note delete\n• note check\n💡 Notes last for 24 hours",
            threadID, messageID
        );
    }

    try {
        switch (action) {
            case "create": {
                const noteText = args.slice(1).join(" ");
                if (!noteText) {
                    return api.sendMessage(
                        "📝 𝗖𝗥𝗘𝗔𝗧𝗘 𝗡𝗢𝗧𝗘\n━━━━━━━━━━━━━━━━━━\n❌ Please provide text for your note.\n💡 Usage: note create [your text]",
                        threadID, messageID
                    );
                }

                await new Promise((resolve, reject) => {
                    api.notes.create(noteText, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                return api.sendMessage(
                    `📝 𝗡𝗢𝗧𝗘 𝗖𝗥𝗘𝗔𝗧𝗘𝗗\n━━━━━━━━━━━━━━━━━━\n✅ Note created successfully!\n📄 Content: ${noteText}\n⏰ Expires in 24 hours`,
                    threadID, messageID
                );
            }

            case "delete": {
                await new Promise((resolve, reject) => {
                    api.notes.check((err, currentNote) => {
                        if (err) reject(err);
                        else if (!currentNote) reject(new Error("No active note found"));
                        else {
                            api.notes.delete(currentNote.id, (err, result) => {
                                if (err) reject(err);
                                else resolve(result);
                            });
                        }
                    });
                });

                return api.sendMessage(
                    "📝 𝗡𝗢𝗧𝗘 𝗗𝗘𝗟𝗘𝗧𝗘𝗗\n━━━━━━━━━━━━━━━━━━\n✅ Note deleted successfully!",
                    threadID, messageID
                );
            }

            case "check": {
                const currentNote = await new Promise((resolve, reject) => {
                    api.notes.check((err, note) => {
                        if (err) reject(err);
                        else resolve(note);
                    });
                });

                if (!currentNote) {
                    return api.sendMessage(
                        "📝 𝗖𝗛𝗘𝗖𝗞 𝗡𝗢𝗧𝗘\n━━━━━━━━━━━━━━━━━━\n📭 No active note found\n💡 Create one with: note create [text]",
                        threadID, messageID
                    );
                }

                const createdTime = new Date(currentNote.creation_time * 1000).toLocaleString();
                const expiresTime = new Date((currentNote.creation_time + 86400) * 1000).toLocaleString();

                return api.sendMessage(
                    `📝 𝗖𝗨𝗥𝗥𝗘𝗡𝗧 𝗡𝗢𝗧𝗘\n━━━━━━━━━━━━━━━━━━\n📄 Content: ${currentNote.description}\n🕐 Created: ${createdTime}\n⏰ Expires: ${expiresTime}\n👤 Privacy: ${currentNote.privacy}`,
                    threadID, messageID
                );
            }

            default: {
                return api.sendMessage(
                    "📝 𝗜𝗡𝗩𝗔𝗟𝗜𝗗 𝗔𝗖𝗧𝗜𝗢𝗡\n━━━━━━━━━━━━━━━━━━\n❌ Invalid action. Use: create, delete, or check",
                    threadID, messageID
                );
            }
        }
    } catch (error) {
        console.error("Note Error:", error);
        
        if (error.message.includes("No active note")) {
            return api.sendMessage(
                "📝 𝗡𝗢 𝗡𝗢𝗧𝗘 𝗙𝗢𝗨𝗡𝗗\n━━━━━━━━━━━━━━━━━━\n❌ No active note to delete\n💡 Create one first with: note create [text]",
                threadID, messageID
            );
        } else if (error.message.includes("login")) {
            return api.sendMessage(
                "📝 𝗟𝗢𝗚𝗜𝗡 𝗘𝗥𝗥𝗢𝗥\n━━━━━━━━━━━━━━━━━━\n❌ Authentication failed\n💡 Please try again later",
                threadID, messageID
            );
        } else {
            return api.sendMessage(
                `📝 𝗘𝗥𝗥𝗢𝗥\n━━━━━━━━━━━━━━━━━━\n❌ ${error.message}\n💡 Please try again`,
                threadID, messageID
            );
        }
    }
};