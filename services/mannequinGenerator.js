import fs from "fs/promises";
import path from "path";
import mime from "mime-types";
import { ai } from "../index.js";
import { createUserContent, Modality } from "@google/genai";

// Utility: convert an image URL to base64 inline data
async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";
    return {
      mimeType: contentType,
      data: Buffer.from(buffer).toString("base64"),
    };
  } catch (error) {
    console.error(`Error fetching image from ${url}:`, error);
    throw error;
  }
}

export async function generateMannequinImage(imageUrls, occasion) {
  try {
    const [top, bottom, accessory, footwear] = imageUrls;

    const prompt = `You are a fashion stylist AI. Generate a stylish, full-body mannequin image for the occasion: ${occasion}. 
Include the following items:
${top ? "- Topwear\n" : ""}${bottom ? "- Bottomwear\n" : ""}${accessory ? "- Accessories\n" : ""}${footwear ? "- Footwear\n" : ""}
Make the mannequin look elegant, well-dressed, and appropriate for the occasion. Use a neutral background with soft lighting.`;

    // Convert all images to inline base64 format (filter out undefined/null URLs)
    const imageParts = await Promise.all(
      imageUrls.filter(url => url).map(fetchImageAsBase64)
    );

    // Create content parts - starting with text prompt
    const parts = [{ text: prompt }];
    
    // Add image parts if they exist
    for (const image of imageParts) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    }

    const contents = createUserContent(parts);

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", // Updated to latest flash model
      contents: [contents], // Needs to be an array of content items
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
    });

    // Extract the response properly
    // const response = await result.response;
    // if (!response.candidates || response.candidates.length === 0) {
    //   throw new Error("No candidates in the response");
    // }

    // Assuming the response contains text with an image URL
    const resultPart = result.candidates[0].content.parts;
    const imagePart = resultPart.find(p => p.inlineData);

    // console.log("AI Response:", imagePart);

    // Extract URL from text response (you might need to parse this differently)
    // const urlMatch = textResponse.match(/https?:\/\/[^\s]+/);
    // return urlMatch ? urlMatch[0] : null;
return imagePart.inlineData.data
  ? `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
  : null;
  } catch (error) {
    console.error("Error generating mannequin image:", error);
    throw error;
  }
}