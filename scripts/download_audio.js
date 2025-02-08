const axios = require("axios");
const fs = require("fs");
const path = require("path");

const videoId = "lhpUP_DOH0g";

if (!videoId) {
  console.error("❌ Error: No video ID provided.");
  process.exit(1);
}

// Get API details from environment variables (set in GitHub Secrets)
const RAPIDAPI_HOST = "youtube-mp36.p.rapidapi.com";
const RAPIDAPI_KEY = "eee55a9833msh8f2dbd8e2b7970bp194fefjsne09ddc646e78";

if (!RAPIDAPI_HOST || !RAPIDAPI_KEY) {
  console.error("❌ Error: Missing RapidAPI credentials.");
  process.exit(1);
}

const options = {
  method: "GET",
  url: `https://${RAPIDAPI_HOST}/get_audio`,
  params: { video_id: videoId },
  headers: {
    "X-RapidAPI-Key": RAPIDAPI_KEY,
    "X-RapidAPI-Host": RAPIDAPI_HOST,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "*/*",
    "Referer": "https://www.example.com",
  },
};

async function fetchAudioUrl() {
  try {
    console.log(`🔍 Fetching audio URL for video ID: ${videoId}...`);
    const response = await axios.request(options);
    if (!response.data || !response.data.audio_url) {
      throw new Error("Invalid API response: No audio URL found.");
    }
    return response.data.audio_url;
  } catch (error) {
    console.error("❌ Error fetching audio URL:", error.response ? error.response.status : error.message);
    process.exit(1);
  }
}

async function downloadAudio(audioUrl) {
  try {
    console.log(`🎵 Downloading audio from: ${audioUrl}...`);

    const response = await axios({
      method: "GET",
      url: audioUrl,
      responseType: "stream",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "*/*",
        "Referer": "https://www.example.com",
      },
    });

    const filePath = path.join(__dirname, `${videoId}.mp3`);
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log(`✅ Download complete: ${filePath}`);
        resolve();
      });
      writer.on("error", (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error("❌ Error downloading audio:", error.response ? error.response.status : error.message);
    process.exit(1);
  }
}

async function main() {
  const audioUrl = await fetchAudioUrl();
  await downloadAudio(audioUrl);
}

main();

