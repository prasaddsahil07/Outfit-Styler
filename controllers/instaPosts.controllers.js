import { InstaPosts } from "../models/instaPosts.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { searchWithGoogleCustom } from "./product.controllers.js";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env(OPENAI_API_KEY),
});

function extractJsonBlock(text) {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
        return text.substring(jsonStart, jsonEnd + 1);
    }
    throw new Error("Could not extract JSON from AI response.");
}

async function getMetaDataFromAI(imageUrl) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful fashion assistant. Only return raw JSON in your replies.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze the clothing and accessories in this image. Return a JSON object with a single key "keywords", whose value is an array of arrays. Each array should contain a short search phrase (2–4 words) describing one visible clothing item or accessory in the image. Make sure to include the item's color, type, and optionally its material or style if visible. These phrases should be specific enough to search for similar fashion products online.

              Example format:
              {
                "keywords": [
                  ["red wrap top"],
                  ["white leather sneakers"],
                  ["sky blue denim mini skirt with belt"],
                  ["gold hoop earrings"]
                ]
              }`
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const responseContent = response.choices[0].message.content.trim();
    console.log("🧠 Raw AI Output:", responseContent);

    const cleanedJson = extractJsonBlock(responseContent);
    const parsed = JSON.parse(cleanedJson);
    return parsed;
  } catch (error) {
    console.error("❌ AI Metadata Generation Error:", error.message);
    throw new Error("Failed to generate metadata from AI");
  }
}

export const showAffiliateLinkWithImage = async (req, res) => {
    const imageFiles = req.files;
    const caption = req.body.caption || "";

    if (!imageFiles || imageFiles.length === 0) {
        return res.status(400).json({ message: "At least one image file is required" });
    }

    try {
        const results = [];

        for (const file of imageFiles) {
            const imageUrl = await uploadOnCloudinary(file.path);
            if (!imageUrl) continue;

            const metaData = await getMetaDataFromAI(imageUrl);
            const { keywords } = metaData;

            const affiliateLinks = await searchWithGoogleCustom(keywords);

            console.log("affiliateResponse: ", affiliateLinks);

            if (!affiliateLinks || affiliateLinks.length === 0) {
                console.warn("No affiliate links found for image:", imageUrl);
                continue;
            }

            const newPost = await InstaPosts.create({
                imageUrl,
                caption,
                uploadedAt: new Date(),
                processed: true,
                affiliateLinks,
            });

            results.push(newPost);
        }

        res.status(201).json({
            message: `${results.length} post(s) created successfully`,
            posts: results,
        });

    } catch (error) {
        console.error("❌ Error processing images:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserFashionInspo = async (req, res) => {
    try {
        // Get 10 most recent posts
        const posts = await InstaPosts.find({ processed: true })
            .sort({ uploadedAt: -1 })
            .limit(3);

        if (!posts.length) {
            return res.status(404).json({ message: "No fashion inspiration available right now." });
        }

        // Randomly pick one post
        const randomPost = posts[Math.floor(Math.random() * posts.length)];

        const allAffiliates = randomPost.affiliateLinks;

        res.status(200).json({
            image: randomPost.imageUrl,
            caption: randomPost.caption,
            likes: Math.floor(Math.random() * 10000) + 100, // optional fake likes
            affiliateProducts: allAffiliates
        });

    } catch (error) {
        console.error("❌ Failed to fetch fashion inspo:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};