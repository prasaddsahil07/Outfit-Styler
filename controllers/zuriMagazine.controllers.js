import { ZuriMagazine } from "../models/zuriMagazine.models.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// Create a new article
export const addArticle = async (req, res) => {
  try {
    const { authorName, category, title, content, subTitle, tags } = req.body;
    const imageFile = req.file;

    if (!authorName || !category || !title || !content) {
      return res.status(400).json({ msg: "Required fields are missing" });
    }

    let bannerImage = undefined;
    if (imageFile) {
      const result = await uploadToCloudinary(imageFile.path);
      bannerImage = result;
    }

    const newArticle = await ZuriMagazine.create({
      authorName,
      category: category.toLowerCase(),
      title,
      content,
      subTitle,
      bannerImage,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : []
    });

    return res.status(201).json({ msg: "Article created", data: newArticle });
  } catch (error) {
    console.error("Error adding article:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

// Update an existing article
export const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { authorName, category, title, content, subTitle, tags } = req.body;
    const imageFile = req.file;

    const existing = await ZuriMagazine.findById(id);
    if (!existing) return res.status(404).json({ msg: "Article not found" });

    if (imageFile) {
      if (existing.bannerImage) {
        await deleteFromCloudinary(existing.bannerImage);
      }
      const result = await uploadToCloudinary(imageFile.path);
      existing.bannerImage = result;
    }

    existing.authorName = authorName || existing.authorName;
    existing.category = category ? category.toLowerCase() : existing.category;
    existing.title = title || existing.title;
    existing.content = content || existing.content;
    existing.subTitle = subTitle || existing.subTitle;
    existing.tags = tags ? tags.split(",").map((tag) => tag.trim()) : existing.tags;

    await existing.save();

    return res.status(200).json({ msg: "Article updated", data: existing });
  } catch (error) {
    console.error("Error updating article:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

// Delete an article
export const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await ZuriMagazine.findById(id);
    if (!article) return res.status(404).json({ msg: "Article not found" });

    if (article.bannerImage) {
      await deleteFromCloudinary(article.bannerImage);
    }

    await ZuriMagazine.findByIdAndDelete(id);
    return res.status(200).json({ msg: "Article deleted" });
  } catch (error) {
    console.error("Error deleting article:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

// Get all articles
export const getAllArticles = async (req, res) => {
  try {
    const articles = await ZuriMagazine.find().sort({ createdAt: -1 });
    return res.status(200).json({ data: articles, msg: "All articles fetched" });
  } catch (error) {
    console.error("Error fetching all articles:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

// Get single article by ID
export const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await ZuriMagazine.findById(id);
    if (!article) return res.status(404).json({ msg: "Article not found" });

    return res.status(200).json({ data: article, msg: "Article fetched" });
  } catch (error) {
    console.error("Error fetching article by ID:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

// Get articles by category
export const getArticlesByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) return res.status(400).json({ msg: "Category is required" });

    const articles = await ZuriMagazine.find({ category: category.toLowerCase() }).sort({ createdAt: -1 });
    return res.status(200).json({ data: articles, msg: "Articles by category fetched" });
  } catch (error) {
    console.error("Error fetching articles by category:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};

// Get all unique categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await ZuriMagazine.distinct("category");
    return res.status(200).json({ data: categories, msg: "Categories fetched" });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};