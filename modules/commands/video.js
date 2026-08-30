module.exports.config = {
  name: "yt",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Original + Zycke fix",
  description: "Search and download YouTube video",
  usePrefix: true,
  commandCategory: "media",
  usages: "[keyword/reply number]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const axios = global.nodemodule.axios;
  const fs = global.nodemodule["fs-extra"];
  const Youtube = global.nodemodule["simple-youtube-api"];

  const { threadID, messageID, senderID } = event;

  // 🔥 STORAGE (TEMP MEMORY)
  if (!global.ytReply) global.ytReply = {};

  // 📩 IF USER REPLIED (CHOOSING NUMBER)
  if (event.type === "message_reply") {
    const replyMsgID = event.messageReply.messageID;

    if (!global.ytReply[replyMsgID]) return;

    const data = global.ytReply[replyMsgID];

    if (senderID != data.author) return;

    const choice = parseInt(event.body);

    if (isNaN(choice) || choice < 1 || choice > data.links.length) {
      return api.sendMessage("❌ Reply number 1-6 only", threadID, messageID);
    }

    try {
      const keysData = await axios.get("https://raw.githubusercontent.com/quyenkaneki/data/main/video.json");
      const keyList = keysData.data.keyVideo;
      const key = keyList[Math.floor(Math.random() * keyList.length)];

      const res = (await axios.request({
        method: "GET",
        url: "https://ytstream-download-youtube-videos.p.rapidapi.com/dl",
        params: { id: data.links[choice - 1] },
        headers: {
          "x-rapidapi-host": "ytstream-download-youtube-videos.p.rapidapi.com",
          "x-rapidapi-key": key.API_KEY
        }
      })).data;

      if (res.status === "fail") {
        return api.sendMessage("❌ Cannot send video", threadID, messageID);
      }

      const title = res.title;
      const quality = Object.keys(res.link)[1];
      const videoURL = res.link[quality][0];

      const file = __dirname + "/cache/yt.mp4";

      const stream = await axios({
        url: videoURL,
        method: "GET",
        responseType: "stream"
      });

      const writer = fs.createWriteStream(file);
      stream.data.pipe(writer);

      writer.on("finish", () => {
        if (fs.statSync(file).size > 25 * 1024 * 1024) {
          fs.unlinkSync(file);
          return api.sendMessage("❌ File too large (>25MB)", threadID, messageID);
        }

        api.sendMessage(
          {
            body: `🎬 ${title}`,
            attachment: fs.createReadStream(file)
          },
          threadID,
          () => fs.unlinkSync(file),
          messageID
        );
      });

    } catch (e) {
      console.error(e);
      return api.sendMessage("❌ Download error", threadID, messageID);
    }
  }

  // 🔍 NORMAL SEARCH
  if (!args.length) {
    return api.sendMessage("❌ Enter search keyword", threadID, messageID);
  }

  const query = args.join(" ");

  const keys = [
    "AIzaSyB5A3Lum6u5p2Ki2btkGdzvEqtZ8KNLeXo",
    "AIzaSyAyjwkjc0w61LpOErHY_vFo6Di5LEyfLK0",
    "AIzaSyBY5jfFyaTNtiTSBNCvmyJKpMIGlpCSB4w",
    "AIzaSyCYCg9qpFmJJsEcr61ZLV5KsmgT1RE5aI4"
  ];

  const yt = new Youtube(keys[Math.floor(Math.random() * keys.length)]);

  try {
    const results = await yt.searchVideos(query, 6);

    let msg = "🎬 Reply with number (1-6)\n\n";
    let links = [];
    let attachments = [];
    let i = 0;

    for (let vid of results) {
      if (!vid.id) continue;

      i++;
      links.push(vid.id);

      msg += `${i}. ${vid.title}\n\n`;

      const thumb = (await axios.get(
        `https://img.youtube.com/vi/${vid.id}/hqdefault.jpg`,
        { responseType: "arraybuffer" }
      )).data;

      const path = __dirname + `/cache/${i}.jpg`;
      fs.writeFileSync(path, thumb);
      attachments.push(fs.createReadStream(path));
    }

    api.sendMessage(
      {
        body: msg,
        attachment: attachments
      },
      threadID,
      (err, info) => {
        // 🔥 SAVE REPLY DATA
        global.ytReply[info.messageID] = {
          author: senderID,
          links
        };
      },
      messageID
    );

  } catch (e) {
    console.error(e);
    return api.sendMessage("❌ Search failed", threadID, messageID);
  }
};