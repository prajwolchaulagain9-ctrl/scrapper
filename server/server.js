/**
 * 🛡️ TRUTH-GUARD AI: 2026 GROQ EDITION (Enhanced Scraper)
 */
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();
const PORT = 3000;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

const TARGET_SUBREDDIT = 'newsnepal289';
// Expanded trusted domains for better verification
const TRUSTED_DOMAINS = 'reuters.com,nytimes.com,bbc.com,ekantipur.com,kathmandupost.com,setopati.com,onlinekhabar.com,ratopati.com,nayapatrikadaily.com';

async function generateSafe(modelName, messages) {
    try {
        const completion = await groq.chat.completions.create({
            messages,
            model: modelName,
            temperature: 0.1,
            response_format: { type: "json_object" }
        });
        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error("Groq Error:", error.message);
        return { is_news: false, verdict: "Error", explanation: "AI service unavailable" };
    }
}

async function getVerifiedContext(headline) {
    if (!process.env.NEWS_API_KEY) return "No API Key available.";
    // Clean headline for better search results
    const query = headline.replace(/[^\w\s]/gi, '').split(' ').slice(0, 7).join(' ');
    try {
        const res = await axios.get(`https://newsapi.org/v2/everything`, {
            params: { q: query, domains: TRUSTED_DOMAINS, pageSize: 3, apiKey: process.env.NEWS_API_KEY }
        });
        
        if (!res.data.articles || res.data.articles.length === 0) return "NO_MATCHING_SOURCES";
        return res.data.articles.map(a => `[${a.source.name}] ${a.title}`).join(' | ');
    } catch (e) { return "Verification search failed."; }
}

app.get('/api/verify-news', async (req, res) => {
    try {
        console.log(`📡 Fetching from r/${TARGET_SUBREDDIT}...`);
        
        // FIX: Added 'User-Agent' to mimic a real browser to prevent Reddit from blocking the request
        const redditRes = await axios.get(`https://www.reddit.com/r/${TARGET_SUBREDDIT}/hot.json?limit=15`, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const rawPosts = redditRes.data.data.children;
        if (!rawPosts || rawPosts.length === 0) {
            return res.status(404).json({ error: "No posts found in subreddit" });
        }

        const posts = rawPosts.filter(p => !p.data.stickied).map(p => ({
            title: p.data.title,
            text: p.data.selftext || "",
            url: `https://reddit.com${p.data.permalink}`
        }));

        const results = [];

        for (const post of posts) {
            const context = await getVerifiedContext(post.title);
            
            // LOGIC: If context is "NO_MATCHING_SOURCES", tell the AI to prioritize "Fake/Unverified"
            const messages = [
                {
                    role: "system",
                    content: `You are a professional Fact-Checker. 
                    - If CONTEXT is "NO_MATCHING_SOURCES", the claim is likely FAKE or UNVERIFIED. 
                    - Truth Score: 0-100. Propaganda Score: 0-100.
                    - Respond in valid JSON.`
                },
                {
                    role: "user",
                    content: `CLAIM: "${post.title}" 
                             CONTEXT: "${context}"
                             
                             Return JSON: {
                                "is_news": true,
                                "verdict": "Real" | "Fake" | "Misleading",
                                "truthScore": number,
                                "propaganda_score": number,
                                "explanation": "Explain why (mention if sources are missing)",
                                "category": "politics" | "economy" | "social"
                             }`
                }
            ];

            const analysis = await generateSafe('llama-3.3-70b-versatile', messages);
            results.push({ claim: post.title, ...analysis, source_link: post.url });
            
            // Prevent hitting Groq/NewsAPI rate limits
            await new Promise(r => setTimeout(r, 400)); 
        }

        res.json(results);
    } catch (error) {
        console.error("Fetch failed:", error.message);
        res.status(500).json({ error: "Failed to process news. Check if Subreddit is public." });
    }
});

app.listen(PORT, () => console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`));