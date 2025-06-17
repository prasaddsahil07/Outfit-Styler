import axios from "axios";
import dotenv from "dotenv";
import { ai } from "../index.js";

dotenv.config();

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// List of fallback keywords for Unsplash images
const fallbackKeywords = [
  "fashion", "runway", "style", "model", "clothing", "outfit", "celebrity"
];

// Random fallback Unsplash image generator
const getFallbackImage = async () => {
  const keyword = fallbackKeywords[Math.floor(Math.random() * fallbackKeywords.length)];
  const url = `https://api.unsplash.com/search/photos?client_id=${UNSPLASH_ACCESS_KEY}&query=${encodeURIComponent(keyword)}&per_page=1`;

  try {
    const { data } = await axios.get(url);
    return data.results[0]?.urls?.regular || null;
  } catch (error) {
    console.error("❌ Unsplash fallback error:", error.message);
    return null;
  }
};

export const getFashionNews = async (req, res) => {
    const keyword = req.query.keyword || "celebrity fashion styles";
    const url = `https://gnews.io/api/v4/search`;

    try {
        const { data } = await axios.get(url, {
        params: {
            q: keyword,
            lang: "en",
            country: "in",
            sortby: "publishedAt",
            max: 8,
            token: GNEWS_API_KEY
        }
        });

    const articles = await Promise.all(
      data.articles.map(async (article) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.image || await getFallbackImage(),
        source: article.source.name
      }))
    );

    res.json({ articles });
  } catch (error) {
    console.error("❌ GNews API Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
