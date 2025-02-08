// download_audio.js
import axios from 'axios';
import open from 'open';

const videoId = process.argv[2];
const apiKey = "eee55a9833msh8f2dbd8e2b7970bp194fefjsne09ddc646e78";

if (!videoId) {
  console.error("❌ No video ID provided.");
  process.exit(1);
}

try {
  console.log(`🔍 Fetching audio URL for video ID: ${videoId}...`);
  
  // Call RapidAPI
  const response = await axios.get("https://youtube-mp36.p.rapidapi.com/dl", {
    params: { id: videoId },
    headers: {
      "x-rapidapi-host": "youtube-mp36.p.rapidapi.com",
      "x-rapidapi-key": apiKey,
    },
  });

  if (response.data.status !== "ok") {
    console.error("❌ Failed to get download URL:", response.data.msg);
    process.exit(1);
  }

  const audioUrl = response.data.link;
  console.log(`🎵 Audio URL: ${audioUrl}`);
  
  // Just log the URL since we're in a GitHub Action environment
  console.log('✅ Copy and paste this URL in your browser to download');

} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
