import { ZuriMagazine } from "../models/zuriMagazine.models.js";

// get articles by category
export const getArticlesByCategory = async (req, res) => {
    try {
        const { category } = req.query;
        if (!category) {
            return res.status(400).json({ msg: "Category is required" });
        }

        const articles = await ZuriMagazine.find({ category }).sort({ createdAt: -1 });

        return res.status(200).json({ data: articles, msg: "Articles as per category fetched successfully" });
    } catch (error) {
        console.error("Error fetching articles:", error);
        return res.status(500).json({ msg: "Internal Server Error" });
    }
};

// get all unique categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await ZuriMagazine.distinct("category");
    return res.status(200).json({ data: categories, msg: "Categories fetched successfully" });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
};