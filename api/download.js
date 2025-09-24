const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');

const app = express();
app.use(cors());
app.use(express.json());

// Get direct download links
app.get('/api/download', async (req, res) => {
    try {
        const { id, quality = 'highest' } = req.query;
        
        if (!id) {
            return res.status(400).json({
                error: '❌ Missing video ID',
                message: 'Please provide YouTube video ID'
            });
        }
        
        const videoUrl = `https://www.youtube.com/watch?v=${id}`;
        
        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).json({
                error: '❌ Invalid video ID',
                message: 'Please provide a valid YouTube video ID'
            });
        }
        
        const info = await ytdl.getInfo(videoUrl);
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        
        // Get best quality audio
        const bestAudio = audioFormats.reduce((prev, current) => {
            return (prev.audioBitrate || 0) > (current.audioBitrate || 0) ? prev : current;
        });
        
        res.json({
            success: true,
            download: {
                title: info.videoDetails.title,
                author: info.videoDetails.author.name,
                videoId: id,
                downloadUrl: bestAudio.url,
                audioBitrate: bestAudio.audioBitrate,
                duration: info.videoDetails.lengthSeconds,
                thumbnail: info.videoDetails.thumbnails[0].url,
                size: formatBytes(bestAudio.contentLength),
                message: '🚀 Direct download link generated!'
            }
        });
    } catch (error) {
        res.status(500).json({
            error: '❌ Download failed',
            message: error.message
        });
    }
});

// Helper function
function formatBytes(bytes) {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = app;
