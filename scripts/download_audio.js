// download_audio.js
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const videoId = process.argv[2];
const apiKey = "eee55a9833msh8f2dbd8e2b7970bp194fefjsne09ddc646e78";

if (!videoId) {
  console.error("❌ No video ID provided.");
  process.exit(1);
}

async function downloadFile(url, outputPath) {
  const writer = fs.createWriteStream(outputPath);
  
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
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
  console.log(`🎵 Got download URL: ${audioUrl}`);
  
  // Set up the file path
  const outputPath = path.join(__dirname, '..', 'downloads', `${videoId}.mp3`);
  
  console.log('⏳ Downloading audio file...');
  await downloadFile(audioUrl, outputPath);
  console.log(`✅ Downloaded successfully to: ${outputPath}`);

} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
