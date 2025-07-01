// import axios from "axios";
// import dotenv from "dotenv";
// import { ai } from "../index.js";

// dotenv.config();

// const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
// const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// // List of fallback keywords for Unsplash images
// const fallbackKeywords = [
//   "fashion", "runway", "style", "model", "clothing", "outfit", "celebrity"
// ];

// // Random fallback Unsplash image generator
// const getFallbackImage = async () => {
//   const keyword = fallbackKeywords[Math.floor(Math.random() * fallbackKeywords.length)];
//   const url = `https://api.unsplash.com/search/photos?client_id=${UNSPLASH_ACCESS_KEY}&query=${encodeURIComponent(keyword)}&per_page=1`;

//   try {
//     const { data } = await axios.get(url);
//     return data.results[0]?.urls?.regular || null;
//   } catch (error) {
//     console.error("❌ Unsplash fallback error:", error.message);
//     return null;
//   }
// };

// export const getFashionNews = async (req, res) => {
//     const keyword = req.query.keyword || "celebrity fashion styles";
//     const url = `https://gnews.io/api/v4/search`;

//     try {
//         const { data } = await axios.get(url, {
//         params: {
//             q: keyword,
//             lang: "en",
//             country: "in",
//             sortby: "publishedAt",
//             max: 8,
//             token: GNEWS_API_KEY
//         }
//         });

//     const articles = await Promise.all(
//       data.articles.map(async (article) => ({
//         title: article.title,
//         description: article.description,
//         url: article.url,
//         image: article.image || await getFallbackImage(),
//         source: article.source.name
//       }))
//     );

//     res.json({ articles });
//   } catch (error) {
//     console.error("❌ GNews API Error:", error.message);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

import { Bookmark } from "../models/bookMarkArticles.models.js";
import { ZuriMagazine } from '../models/zuriMagazine.model.js';

export const getAllBookmarkedArticles = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all bookmarks by the user and populate article data
    const bookmarks = await Bookmark.find({ userId })
      .populate({
        path: 'articleId',
        model: 'ZuriMagazine',
        select: 'title authorName bannerImage category createdAt' // Select only the needed fields
      })
      .sort({ createdAt: -1 }); // Optional: latest bookmarks first

    // Extract populated article objects
    const articles = bookmarks
      .map(bookmark => bookmark.articleId)
      .filter(article => article !== null); // In case the article was deleted

    return res.status(200).json({
      msg: "Bookmarked articles fetched successfully",
      count: articles.length,
      data: articles
    });
  } catch (error) {
    console.error("Error fetching bookmarked articles:", error);
    return res.status(500).json({ msg: "Something went wrong while fetching bookmarks" });
  }
};


// switch between adding and removing from bookmarks
export const toggleBookmark = async (req, res) => {
  const { articleId } = req.params;
  const userId = req.user._id;

  try {
    const existing = await Bookmark.findOne({ userId, articleId });

    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.status(200).json({ msg: "Bookmark removed" });
    }

    await Bookmark.create({ userId, articleId });
    return res.status(201).json({ msg: "Article bookmarked" });
  } catch (err) {
    console.error("Bookmark toggle error:", err);
    return res.status(500).json({ msg: "Something went wrong" });
  }
};
