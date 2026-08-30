const axios = require('axios');
const fs = require('fs');
const path = require('path');
const getFBInfo = require("@xaviabot/fb-downloader");

module.exports.config = {
  name: "adown",
  version: "1.0",
  hasPermssion: 0,
  credits: "Jonell Magallanes",
  description: "Automatically download TikTok, Facebook, Instagram, and Pinterest videos",
  usePrefix: false,
  hide: true,
  commandCategory: "Media",
  usage: "[on/off]",
  cooldowns: 3,
};

const autodlPath = path.join(__dirname, 'autodl.json');

function loadAutodlSettings() {
  try {
    if (!fs.existsSync(autodlPath)) {
      const defaultSettings = {};
      fs.writeFileSync(autodlPath, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    return JSON.parse(fs.readFileSync(autodlPath, 'utf8'));
  } catch (error) {
    console.error('Error loading autodl settings:', error);
    return {};
  }
}

function saveAutodlSettings(settings) {
  try {
    fs.writeFileSync(autodlPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving autodl settings:', error);
    return false;
  }
}

module.exports.handleEvent = async function ({ api, event }) {
  if (event.body !== null && event.isGroup) {
    const settings = loadAutodlSettings();
    const threadId = event.threadID.toString();
    
    if (!settings[threadId]) return;
    
    const tiktokLinkRegex = /https:\/\/(www\.|vt\.|vm\.)?tiktok\.com\//;
    const facebookLinkRegex = /https:\/\/www\.facebook\.com\/\S+/;
    const instagramLinkRegex = /https:\/\/www\.instagram\.com\/(p|reel|stories)\/\S+/;
    const pinterestLinkRegex = /https:\/\/(www\.)?pinterest\.(com|ph)\/\S+|https:\/\/pin\.it\/\S+/;
    const link = event.body;
    
    if (tiktokLinkRegex.test(link)) {
      api.setMessageReaction("📥", event.messageID, () => { }, true);
      downloadAndSendTikTokContent(link, api, event);
    } else if (facebookLinkRegex.test(link)) {
      api.setMessageReaction("📥", event.messageID, () => { }, true);
      downloadAndSendFBContent(link, api, event);
    } else if (instagramLinkRegex.test(link)) {
      api.setMessageReaction("📥", event.messageID, () => { }, true);
      downloadAndSendInstagramContent(link, api, event);
    } else if (pinterestLinkRegex.test(link)) {
      api.setMessageReaction("📥", event.messageID, () => { }, true);
      downloadAndSendPinterestContent(link, api, event);
    }
  }
};

module.exports.run = async function ({ api, event, args }) {
  const settings = loadAutodlSettings();
  const threadId = event.threadID.toString();
  
  if (args[0] === 'on') {
    settings[threadId] = true;
    if (saveAutodlSettings(settings)) {
      return api.sendMessage("🟢 | 𝖠𝗎𝗍𝗈 𝖣𝗈𝗐𝗇𝗅𝗈𝖺𝖽𝖾𝗋 𝗁𝖺𝗌 𝖻𝖾𝖾𝗇 𝖳𝖴𝖱𝖭𝖤𝖣 𝖮𝖭", event.threadID);
    } else {
      return api.sendMessage("❌ | 𝖥𝖺𝗂𝗅𝖾𝖽 𝗍𝗈 𝗍𝗎𝗋𝗇 𝗈𝗇 𝖠𝗎𝗍𝗈 𝖣𝗈𝗐𝗇𝗅𝗈𝖺𝖽𝖾𝗋", event.threadID);
    }
  } else if (args[0] === 'off') {
    settings[threadId] = false;
    if (saveAutodlSettings(settings)) {
      return api.sendMessage("🔴 | 𝖠𝗎𝗍𝗈 𝖣𝗈𝗐𝗇𝗅𝗈𝖺𝖽𝖾𝗋 𝗁𝖺𝗌 𝖻𝖾𝖾𝗇 𝖳𝖴𝖱𝖭𝖤𝖣 𝖮𝖥𝖥", event.threadID);
    } else {
      return api.sendMessage("❌ | 𝖥𝖺𝗂𝗅𝖾𝖽 𝗍𝗈 𝗍𝗎𝗋𝗇 𝗈𝖿𝖿 𝖠𝗎𝗍𝗈 𝖣𝗈𝗐𝗇𝗅𝗈𝖺𝖽𝖾𝗋", event.threadID);
    }
  } else {
    const status = settings[threadId] ? "🟢 𝖮𝖭" : "🔴 𝖮𝖥𝖥";
    return api.sendMessage(`📝 | 𝖠𝗎𝗍𝗈 𝖣𝗈𝗐𝗇𝗅𝗈𝖺𝖽𝖾𝗋 𝖲𝗍𝖺𝗍𝗎𝗌: ${status}\n━━━━━━━━━━━━━━━━━━\n𝖴𝗌𝖾: 𝖺𝖽𝗈𝗐𝗇 𝗈𝗇 - 𝗍𝗈 𝗍𝗎𝗋𝗇 𝗈𝗇 𝖺𝗎𝗍𝗈 𝖽𝗈𝗐𝗇𝗅𝗈𝖺𝖽𝖾𝗋\n𝖴𝗌𝖾: 𝖺𝖽𝗈𝗐𝗇 𝗈𝖿𝖿 - 𝗍𝗈 𝗍𝗎𝗋𝗇 𝗈𝖿𝖿 𝖺𝗎𝗍𝗈 𝖽𝗈𝗐𝗇𝗅𝗈𝖺𝖽𝖾𝗋`, event.threadID);
  }
};

const downloadAndSendTikTokContent = async (url, api, event) => {
  try {
    const response = await axios.post(`https://www.tikwm.com/api/`, { url: url });
    const data = response.data.data;
    
    if (!data.play) {
      throw new Error('No video URL found');
    }

    const videoResponse = await axios({
      method: 'get',
      url: data.play,
      responseType: 'stream'
    });

    await api.sendMessage({
      body: `🎵 𝗧𝗜𝗞𝗧𝗢𝗞 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥\n━━━━━━━━━━━━━━━━━━\n📝 𝗧𝗶𝘁𝗹𝗲: ${data.title || 'No Title'}\n❤️ 𝗟𝗶𝗸𝗲𝘀: ${data.digg_count || 0}\n👤 𝗔𝘂𝘁𝗵𝗼𝗿: ${data.author?.nickname || 'Unknown'}\n━━━━━━━━━━━━━━━━━━`,
      attachment: videoResponse.data
    }, event.threadID, event.messageID);

  } catch (error) {
    console.error('TikTok API error:', error);
  }
};

const downloadAndSendFBContent = async (url, api, event) => {
  try {
    const result = await getFBInfo(url);
    
    if (!result.hd && !result.sd) {
      throw new Error('No video URL found');
    }

    const videoUrl = result.hd || result.sd;
    
    const videoResponse = await axios({
      method: 'get',
      url: videoUrl,
      responseType: 'stream'
    });

    await api.sendMessage({
      body: `📹 𝗙𝗔𝗖𝗘𝗕𝗢𝗢𝗞 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥\n━━━━━━━━━━━━━━━━━━\n📝 𝗧𝗶𝘁𝗹𝗲: ${result.title || 'Facebook Video'}\n✅ 𝖲𝗎𝖼𝖼𝖾𝗌𝗌𝖿𝗎𝗅𝗅𝗒 𝖽𝗈𝗐𝗇𝗅𝗈𝖺𝖽𝖾𝖽 𝖥𝖺𝖼𝖾𝖻𝗈𝗈𝗄 𝗏𝗂𝖽𝖾𝗈\n━━━━━━━━━━━━━━━━━━`,
      attachment: videoResponse.data
    }, event.threadID, event.messageID);

  } catch (error) {
    console.error('Facebook API error:', error);

  }
};

const downloadAndSendInstagramContent = async (url, api, event) => {
  try {
    const response = await axios.get(`http://api.hutchingd.x10.mx/api/dl/insta.php?url=${encodeURIComponent(url)}`);
    const data = response.data;
    
    if (data.code !== 100000 || !data.data || !data.data.info || data.data.info.length === 0) {
      throw new Error('Invalid Instagram API response');
    }

    const mediaInfo = data.data.info[0];
    const videoUrl = mediaInfo.url;
    const mediaType = data.data.media_type === 'reel' ? 'Reel' : 'Post';

    if (!videoUrl) {
      throw new Error('No video URL found');
    }

    const videoResponse = await axios({
      method: 'get',
      url: videoUrl,
      responseType: 'stream'
    });

    await api.sendMessage({
      body: `📸 𝗜𝗡𝗦𝗧𝗔𝗚𝗥𝗔𝗠 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥\n━━━━━━━━━━━━━━━━━━\n📝 𝗧𝘆𝗽𝗲: ${mediaType}\n✅ 𝖲𝗎𝖼𝖼𝖾𝗌𝗌𝖿𝗎𝗅𝗅𝗒 𝖽𝗈𝗐𝗇𝗅𝗈𝖺𝖽𝖾𝖽 𝖨𝗇𝗌𝗍𝖺𝗀𝗋𝖺𝗆 𝗏𝗂𝖽𝖾𝗈\n━━━━━━━━━━━━━━━━━━`,
      attachment: videoResponse.data
    }, event.threadID, event.messageID);

  } catch (error) {
    console.error('Instagram API error:', error);
    
  }
};

const downloadAndSendPinterestContent = async (url, api, event) => {
  try {
    const response = await axios.get(`http://api.hutchingd.x10.mx/api/dl/pinterest.php?url=${encodeURIComponent(url)}`);
    const data = response.data;
    
    if (!data.download) {
      throw new Error('Invalid Pinterest API response');
    }

    const videoResponse = await axios({
      method: 'get',
      url: data.download,
      responseType: 'stream'
    });

    await api.sendMessage({
      body: `📌 𝗣𝗜𝗡𝗧𝗘𝗥𝗘𝗦𝗧 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥\n━━━━━━━━━━━━━━━━━━\n📝 𝗧𝗶𝘁𝗹𝗲: ${data.title || 'Pinterest Video'}\n📊 𝗦𝗶𝘇𝗲: ${data.size || 'Unknown'}\n✅ 𝖲𝗎𝖼𝖼𝖾𝗌𝗌𝖿𝗎𝗅𝗅𝗒 𝖽𝗈𝗐𝗇𝗅𝗈𝖺𝖽𝖾𝖽 𝖯𝗂𝗇𝗍𝖾𝗋𝖾𝗌𝗍 𝗏𝗂𝖽𝖾𝗈\n━━━━━━━━━━━━━━━━━━`,
      attachment: videoResponse.data
    }, event.threadID, event.messageID);

  } catch (error) {
    console.error('Pinterest API error:', error);
    
  }
};