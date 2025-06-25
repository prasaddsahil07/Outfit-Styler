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

export async function generateModelImage(imageUrls, occasion) {
  try {
    const [top, bottom, accessory, footwear] = imageUrls;

    const prompt = `You are an expert fashion stylist AI specializing in creating sophisticated, occasion-appropriate outfits. Generate a high-quality, full-body image of an elegant female model styled for: ${occasion}.

    STYLING REQUIREMENTS:
    ${top ? "• Top: Select sophisticated topwear that complements the occasion and body silhouette\n" : ""}${bottom ? "• Bottom: Choose well-fitted bottomwear that balances the overall look\n" : ""}${accessory ? "• Accessories: Include tasteful accessories that enhance without overwhelming the outfit\n" : ""}${footwear ? "• Footwear: Select appropriate shoes that complete the ensemble\n" : ""}

    VISUAL SPECIFICATIONS:
    - Model pose: Confident, natural stance with good posture
    - Styling: Ensure proper fit, color coordination, and seasonal appropriateness
    - Aesthetic: Modern, polished, and fashion-forward appearance
    - Background: Clean, minimalist backdrop in neutral tones (white, light gray, or soft beige)
    - Lighting: Professional studio lighting with soft shadows to highlight outfit details
    - Image quality: High-resolution, sharp focus on clothing details and overall composition

    DESIGN PRINCIPLES:
    - Maintain elegance and sophistication appropriate for the specified occasion
    - Ensure color harmony and balanced proportions
    - Consider current fashion trends while maintaining timeless appeal
    - Focus on creating a cohesive, well-curated look from head to toe

    Style the model to embody confidence and grace, showcasing how the outfit would look on someone attending ${occasion}.`;

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