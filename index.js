const express = require('express');
const ytDlp = require('yt-dlp-exec');
const tmp = require('tmp');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

/**
 * GET /download?query=...
 * Downloads first matching YouTube audio as MP3 for the search query.
 */
app.get('/download', async (req, res) => {
  const query = req.query.query;
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Missing or invalid query parameter.' });
  }
  
  // Create a temp file for output
  const tempFile = tmp.fileSync({ postfix: '.mp3' });
  const outputPath = tempFile.name;
  
  try {
    // Use yt-dlp to search and download first result as mp3
    await ytDlp(`ytsearch1:${query}`, {
      output: outputPath,
      format: 'bestaudio/best',
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: 0,
      quiet: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true
    });
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${query.replace(/[^a-z0-9]/gi, '_')}.mp3"`);
    
    // Pipe file to response
    const readStream = fs.createReadStream(outputPath);
    readStream.on('end', () => tempFile.removeCallback());
    readStream.pipe(res);
  } catch (err) {
    tempFile.removeCallback();
    res.status(500).json({ error: 'Failed to download or process audio.', details: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('YouTube Scrapper Audio API is running! Use /download?query=song+name');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});