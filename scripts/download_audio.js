const axios = require("axios");
const fs = require("fs");
const path = require("path");

const videoId = process.argv[2]; // Get video ID from command line argument
const apiKey = "your-rapidapi-key"; // 🔥 Replace with your actual RapidAPI key

if (!videoId) {
  console.error("❌ No video ID provided.");
  process.exit(1);
}

(async () => {
  try {
    console.log(`🔍 Fetching audio URL for video ID: ${videoId}...`);

    // Call RapidAPI
    const response = await axios.get("https://youtube-mp36.p.rapidapi.com/dl", {
      params: { id: videoId },
      headers: {
        "x-rapidapi-host": "youtube-mp36.p.rapidapi.com",
        "x-rapidapi-key": apiKey, // 🔥 API Key used directly
      },
    });

    if (response.data.status !== "ok") {
      console.error("❌ Failed to get download URL:", response.data.msg);
      process.exit(1);
    }

    const audioUrl = response.data.link;
    console.log(`🎵 Downloading audio from: ${audioUrl}`);

    // Download audio file
    const audioResponse = await axios({
      method: "GET",
      url: audioUrl,
      responseType: "stream",
    });

    const filePath = path.join(__dirname, "..", "downloads", `${videoId}.mp3`);
    const writer = fs.createWriteStream(filePath);

    audioResponse.data.pipe(writer);

    writer.on("finish", () => {
      console.log(`✅ Downloaded: ${filePath}`);
    });

    writer.on("error", (err) => {
      console.error("❌ Error writing file:", err);
      process.exit(1);
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
