const axios = require('axios');

module.exports.config = {
  name: "ai",
  version: "1.0.0",
  hasPermssion: 0,
  description: "Ask AI anything using ChatGPT4",
  usePrefix: true,
  commandCategory: "AI",
  usages: "<question>",
  cooldowns: 5,
  credits: "Jonell Magallanes"
};

module.exports.run = async ({ api, event, args }) => {
  const question = args.join(" ");
  const hasImage = event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0;

  api.setMessageReaction("⏳", event.messageID, () => {}, true);

  try {
    if (hasImage) {
      const imageUrl = event.messageReply.attachments[0].url;
      const response = await axios.get(`https://doux.gleeze.com/ai/chipp?message=${encodeURIComponent(question || "what is this?")}&url=${encodeURIComponent(imageUrl)}`);
      const data = response.data;
      const answer = data.response || "Sorry, I couldn't analyze the image.";
      api.setMessageReaction("✅", event.messageID, () => {}, true);
      api.sendMessage(answer, event.threadID, event.messageID);
    } else {
      if (!question) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage("❌ Please provide a question or reply to an image.", event.threadID, event.messageID);
      }
      const response = await axios.get(`https://doux.gleeze.com/ai/chatgpt?prompt=${encodeURIComponent(question)}&model=chatgpt4`);
      const data = response.data;
      const answer = data.answer || "Sorry, I couldn't get an answer.";
      api.setMessageReaction("✅", event.messageID, () => {}, true);
      api.sendMessage(answer, event.threadID, event.messageID);
    }
  } catch (error) {
    console.error("AI Error:", error);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    api.sendMessage("❌", event.threadID, event.messageID);
  }
};