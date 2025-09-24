const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());

// FREE YouTube Scraper - No API Key Needed
const scrapeYouTube = async (query) => {
    try {
        const searchQuery = encodeURIComponent(query + ' official audio');
        const url = `https://www.youtube.com/results?search_query=${searchQuery}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const videos = [];
        
        // Extract video data from YouTube results
        $('script').each((i, script) => {
            const content = $(script).html();
            if (content && content.includes('var ytInitialData')) {
                const jsonStart = content.indexOf('{');
                const jsonEnd = content.lastIndexOf('}') + 1;
                const jsonStr = content.substring(jsonStart, jsonEnd);
                
                try {
                    const data = JSON.parse(jsonStr);
                    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
                    
                    if (contents) {
                        contents.forEach(content => {
                            const items = content?.itemSectionRenderer?.contents;
                            if (items) {
                                items.forEach(item => {
                                    const video = item?.videoRenderer;
                                    if (video) {
                                        videos.push({
                                            title: video.title?.runs?.[0]?.text || 'Unknown',
                                            videoId: video.videoId,
                                            url: `https://www.youtube.com/watch?v=${video.videoId}`,
                                            thumbnail: video.thumbnail?.thumbnails?.[0]?.url || '',
                                            duration: video.lengthText?.simpleText || '0:00',
                                            author: video.ownerText?.runs?.[0]?.text || 'Unknown',
                                            views: video.viewCountText?.simpleText?.replace(/[^0-9]/g, '') || '0'
                                        });
                                    }
                                });
                            }
                        });
                    }
                } catch (e) {
                    console.log('Parsing error, trying alternative method');
                }
            }
        });
        
        // Fallback method
        if (videos.length === 0) {
            // Alternative scraping method
            const response2 = await axios.get(`https://invidious.io/api/v1/search?q=${searchQuery}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; YouTubeScraper/1.0)'
                }
            });
            
            return response2.data.filter(item => item.type === 'video').slice(0, 10).map(video => ({
                title: video.title,
                videoId: video.videoId,
                url: `https://www.youtube.com/watch?v=${video.videoId}`,
                thumbnail: video.videoThumbnails?.[0]?.url || '',
                duration: video.lengthSeconds ? new Date(video.lengthSeconds * 1000).toISOString().substr(11, 8) : '0:00',
                author: video.author,
                views: video.viewCount?.toString() || '0'
            }));
        }
        
        return videos.slice(0, 10);
    } catch (error) {
        throw new Error(`Scraping failed: ${error.message}`);
    }
};

// Routes
app.get('/', (req, res) => {
    res.json({
        status: '🔥 FREE YouTube Scraper Online',
        message: 'No API Key Required - Completely Free',
        endpoints: {
            search: '/api/search?q=<query>',
            download: '/api/download?id=<video_id>',
            info: '/api/info?id=<video_id>'
        },
        note: 'This scraper is completely free and requires no API keys'
    });
});

// Search endpoint
app.get('/api/search', async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;
        
        if (!q) {
            return res.status(400).json({
                error: '❌ Missing query',
                message: 'Please provide a search query'
            });
        }
        
        const results = await scrapeYouTube(q);
        const limited = results.slice(0, parseInt(limit));
        
        res.json({
            success: true,
            query: q,
            results: limited,
            count: limited.length,
            message: '🎉 Scraped successfully - No API key needed!'
        });
    } catch (error) {
        res.status(500).json({
            error: '❌ Search failed',
            message: error.message
        });
    }
});

// Export for Vercel
module.exports = app;
