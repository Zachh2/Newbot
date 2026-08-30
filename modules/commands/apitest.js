const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: "apitest",
    version: "1.0.0",
    hasPermssion: 0,
    description: "Test API endpoints and display response information",
    usePrefix: true,
    hide: false,
    commandCategory: "Developer",
    usages: "/apitest <url>",
    cooldowns: 15,
    credits: "Jonell Magallanes"
};

module.exports.run = async function ({ api, event, args }) {
    if (!args[0]) {
        return api.sendMessage("❓ 𝗨𝗦𝗔𝗚𝗘\n━━━━━━━━━━━━━━━━━━\n📍 Please provide API URL\nExample: /apitest https://api.example.com/data\n━━━━━━━━━━━━━━━━━━", event.threadID);
    }

    const url = args[0];
    const startTime = Date.now();

    try {
        const response = await axios.get(url, {
            timeout: 10000,
            responseType: 'arraybuffer',
            validateStatus: function (status) {
                return status >= 200 && status < 600;
            }
        });

        const responseTime = Date.now() - startTime;
        const contentType = response.headers['content-type'] || 'unknown';
        const contentLength = response.headers['content-length'] || 'unknown';
        const statusCode = response.status;
        const statusText = response.statusText;

        const isImage = contentType.startsWith('image/');
        const isAudio = contentType.startsWith('audio/');
        const isVideo = contentType.startsWith('video/');
        const isJSON = contentType.includes('application/json');
        const isText = contentType.includes('text/');

        if (isAudio || isVideo) {
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            
            const fileExtension = isAudio ? 'mp3' : 'mp4';
            const fileName = `api_${Date.now()}.${fileExtension}`;
            const filePath = path.join(cacheDir, fileName);
            
            fs.writeFileSync(filePath, Buffer.from(response.data));
            
            const mediaType = isAudio ? 'Music' : 'Video';
            
            api.sendMessage({
                body: `📁 𝗔𝗣𝗜 𝗧𝗘𝗦𝗧 𝗥𝗘𝗦𝗨𝗟𝗧\n━━━━━━━━━━━━━━━━━━\n📊 𝗦𝘁𝗮𝘁𝘂𝘀 𝗖𝗼𝗱𝗲: ${statusCode} ${statusText}\n⏱️ 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗧𝗶𝗺𝗲: ${responseTime}ms\n📦 𝗖𝗼𝗻𝘁𝗲𝗻𝘁 𝗧𝘆𝗽𝗲: ${contentType}\n💾 𝗖𝗼𝗻𝘁𝗲𝗻𝘁 𝗟𝗲𝗻𝗴𝘁𝗵: ${contentLength} bytes\n\n📎 𝗧𝗵𝗶𝘀 𝗔𝗣𝗜 𝗿𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗵𝗮𝘀 𝗮𝘁𝘁𝗮𝗰𝗵𝗺𝗲𝗻𝘁 (${mediaType})\n━━━━━━━━━━━━━━━━━━`,
                attachment: fs.createReadStream(filePath)
            }, event.threadID, () => {
                fs.unlinkSync(filePath);
            });
            
        } else if (isImage) {
            api.sendMessage(`📁 𝗔𝗣𝗜 𝗧𝗘𝗦𝗧 𝗥𝗘𝗦𝗨𝗟𝗧\n━━━━━━━━━━━━━━━━━━\n📊 𝗦𝘁𝗮𝘁𝘂𝘀 𝗖𝗼𝗱𝗲: ${statusCode} ${statusText}\n⏱️ 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗧𝗶𝗺𝗲: ${responseTime}ms\n📦 𝗖𝗼𝗻𝘁𝗲𝗻𝘁 𝗧𝘆𝗽𝗲: ${contentType}\n💾 𝗖𝗼𝗻𝘁𝗲𝗻𝘁 𝗟𝗲𝗻𝗴𝘁𝗵: ${contentLength} bytes\n\n📎 𝗧𝗵𝗶𝘀 𝗔𝗣𝗜 𝗿𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗵𝗮𝘀 𝗮𝘁𝘁𝗮𝗰𝗵𝗺𝗲𝗻𝘁 (𝗜𝗺𝗮𝗴𝗲)\n━━━━━━━━━━━━━━━━━━`, event.threadID);
            
        } else if (isJSON) {
            try {
                const jsonData = JSON.parse(Buffer.from(response.data).toString());
                const formattedJSON = JSON.stringify(jsonData, null, 2);
                const truncatedJSON = formattedJSON.length > 1500 ? formattedJSON.substring(0, 1500) + "\n\n... (response truncated)" : formattedJSON;
                
                api.sendMessage(`📁 𝗔𝗣𝗜 𝗧𝗘𝗦𝗧 𝗥𝗘𝗦𝗨𝗟𝗧\n━━━━━━━━━━━━━━━━━━\n📊 𝗦𝘁𝗮𝘁𝘂𝘀 𝗖𝗼𝗱𝗲: ${statusCode} ${statusText}\n⏱️ 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗧𝗶𝗺𝗲: ${responseTime}ms\n📦 𝗖𝗼𝗻𝘁𝗲𝗻𝘁 𝗧𝘆𝗽𝗲: ${contentType}\n💾 𝗖𝗼𝗻𝘁𝗲𝗻𝘁 𝗟𝗲𝗻𝗴𝘁𝗵: ${contentLength} bytes\n\n📄 𝗝𝗦𝗢𝗡 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲:\n${truncatedJSON}\n━━━━━━━━━━━━━━━━━━`, event.threadID);
                
            } catch (jsonError) {
                const textResponse = Buffer.from(response.data).toString();
                const truncatedText = textResponse.length > 1500 ? textResponse.substring(0, 1500) + "\n\n... (response truncated)" : textResponse;
                
                api.sendMessage(`📁 𝗔𝗣𝗜 𝗧𝗘𝗦𝗧 𝗥𝗘𝗦𝗨𝗟𝗧\n━━━━━━━━━━━━━━━━━━\n📊 𝗦𝘁𝗮𝘁𝘂𝘀 𝗖𝗼𝗱𝗲: ${statusCode} ${statusText}\n⏱️ 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗧𝗶𝗺𝗲: ${responseTime}ms\n📦 𝗖𝗼𝗻𝘁𝗲𝗻𝘁 𝗧𝘆𝗽𝗲: ${contentType}\n💾 𝗖𝗼𝗻𝘁𝗲𝗻𝘁 𝗟𝗲𝗻𝗴𝘁𝗵: ${contentLength} bytes\n\n📝 𝗧𝗲𝘅𝘁 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲:\n${truncatedText}\n━━━━━━━━━━━━━━━━━━`, event.threadID);
            }
            
        } else if (isText) {
            const textResponse = Buffer.from(response.data).toString();
            const truncatedText = textResponse.length > 1500 ? textResponse.substring(0, 1500) + "\n\n... (response truncated)" : textResponse;
            
            api.sendMessage(`📁 𝗔𝗣𝗜 𝗧𝗘𝗦𝗧 𝗥𝗘𝗦𝗨𝗟𝗧\n━━━━━━━━━━━━━━━━━━\n📊 𝗦𝘁𝗮𝘁𝘂𝘀 𝗖𝗼𝗱𝗲: ${statusCode} ${statusText}\n⏱️ 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗧𝗶𝗺𝗲: ${responseTime}ms\n📦 𝗖𝗼𝗻𝘁𝗲𝗻𝘁 𝗧𝘆𝗽𝗲: ${contentType}\n💾 𝗖𝗼𝗻𝘁𝗲𝗻𝘁 𝗟𝗲𝗻𝗴𝘁𝗵: ${contentLength} bytes\n\n📝 𝗧𝗲𝘅𝘁 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲:\n${truncatedText}\n━━━━━━━━━━━━━━━━━━`, event.threadID);
            
        } else {
            api.sendMessage(`📁 𝗔𝗣𝗜 𝗧𝗘𝗦𝗧 𝗥𝗘𝗦𝗨𝗟𝗧\n━━━━━━━━━━━━━━━━━━\n📊 𝗦𝘁𝗮𝘁𝘂𝘀 𝗖𝗼𝗱𝗲: ${statusCode} ${statusText}\n⏱️ 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗧𝗶𝗺𝗲: ${responseTime}ms\n📦 𝗖𝗼𝗻𝘁𝗲𝗻𝘁 𝗧𝘆𝗽𝗲: ${contentType}\n💾 𝗖𝗼𝗻𝘁𝗲𝗻𝘁 𝗟𝗲𝗻𝗴𝘁𝗵: ${contentLength} bytes\n\n📦 𝗨𝗻𝗸𝗻𝗼𝘄𝗻 𝗿𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝘁𝘆𝗽𝗲\n━━━━━━━━━━━━━━━━━━`, event.threadID);
        }

    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        if (error.response) {
            api.sendMessage(`❌ 𝗔𝗣𝗜 𝗧𝗘𝗦𝗧 𝗘𝗥𝗥𝗢𝗥\n━━━━━━━━━━━━━━━━━━\n📊 𝗦𝘁𝗮𝘁𝘂𝘀 𝗖𝗼𝗱𝗲: ${error.response.status}\n⏱️ 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗧𝗶𝗺𝗲: ${responseTime}ms\n💀 𝗘𝗿𝗿𝗼𝗿: ${error.message}\n━━━━━━━━━━━━━━━━━━`, event.threadID);
        } else if (error.request) {
            api.sendMessage(`❌ 𝗔𝗣𝗜 𝗧𝗘𝗦𝗧 𝗘𝗻𝗱𝗽𝗼𝗶𝗻𝘁 𝗡𝗼𝘁 𝗙𝗼𝘂𝗻𝗱\n━━━━━━━━━━━━━━━━━━\n⏱️ 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗧𝗶𝗺𝗲: ${responseTime}ms\n💀 𝗘𝗿𝗿𝗼𝗿: No response received from server\n━━━━━━━━━━━━━━━━━━`, event.threadID);
        } else {
            api.sendMessage(`❌ 𝗔𝗣𝗜 𝗧𝗘𝗦𝗧 𝗘𝗥𝗥𝗢𝗥\n━━━━━━━━━━━━━━━━━━\n⏱️ 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗧𝗶𝗺𝗲: ${responseTime}ms\n💀 𝗘𝗿𝗿𝗼𝗿: ${error.message}\n━━━━━━━━━━━━━━━━━━`, event.threadID);
        }
    }
};