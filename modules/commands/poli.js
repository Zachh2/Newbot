const axios = require('axios');

module.exports.config = {
  name: "poli",
  version: "1.0.",
  hasPermssion: 0,
  credits: "jameslim",
  description: "generate image from polination",
  usePrefix: true,
  commandCategory: "image",
  usages: "query",
  cooldowns: 2,
};

module.exports.run = async ({api, event, args }) => {
  let { threadID, messageID } = event;
  let query = args.join(" ");
  if (!query) return api.sendMessage("put text/query", threadID, messageID);

  try {
    // Get the image stream directly
    const imageResponse = await axios({
      method: 'get',
      url: `https://image.pollinations.ai/prompt/${query}`,
      responseType: 'stream'
    });

    await api.sendMessage({
      body: `Here is what I Generated...`,
      attachment: imageResponse.data
    }, threadID, messageID);

  } catch (error) {
    console.error('Poli command error:', error);
    api.sendMessage("❌ Failed to generate image. Please try again.", threadID, messageID);
  }
};