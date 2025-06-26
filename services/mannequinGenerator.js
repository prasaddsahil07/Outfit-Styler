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

export async function generateModelImage(imageUrls, occasion, badItemImages = [], description = "") {
  try {
    const [top, bottom, accessory, footwear] = imageUrls;
    const labels = ['Topwear', 'Bottomwear', 'Accessory', 'Footwear'];
    
    // Filter out bad items - only use good items for AI generation
    const goodItems = imageUrls.map((url, index) => ({
      url,
      label: labels[index],
      isGood: url && !badItemImages.includes(url)
    })).filter(item => item.url && item.isGood);

    // Identify what items we have vs what we need AI to generate
    const hasTop = goodItems.some(item => item.label === 'Topwear');
    const hasBottom = goodItems.some(item => item.label === 'Bottomwear');
    const hasAccessory = goodItems.some(item => item.label === 'Accessory');
    const hasFootwear = goodItems.some(item => item.label === 'Footwear');

    // Build dynamic prompt based on what user provided vs what AI needs to generate
    let itemInstructions = "OUTFIT COMPOSITION:\n";
    
    if (hasTop) {
      itemInstructions += "• Topwear: USE the exact topwear shown in the reference image - match its style, color, and design precisely\n";
    } else {
      itemInstructions += `• Topwear: GENERATE appropriate topwear for ${occasion} that complements the provided items\n`;
    }
    
    if (hasBottom) {
      itemInstructions += "• Bottomwear: USE the exact bottomwear shown in the reference image - match its style, color, and design precisely\n";
    } else {
      itemInstructions += `• Bottomwear: GENERATE appropriate bottomwear for ${occasion} that complements the provided items\n`;
    }
    
    if (hasFootwear) {
      itemInstructions += "• Footwear: USE the exact footwear shown in the reference image - match its style, color, and design precisely\n";
    } else {
      itemInstructions += `• Footwear: GENERATE appropriate footwear for ${occasion} that complements the provided items\n`;
    }
    
    if (hasAccessory) {
      itemInstructions += "• Accessories: USE the exact accessories shown in the reference image - match their style, color, and design precisely\n";
    } else {
      itemInstructions += `• Accessories: GENERATE tasteful accessories for ${occasion} that enhance the overall look\n`;
    }

    // Build description section for the prompt
    const descriptionSection = description && description.trim() 
      ? `\nADDITIONAL STYLING REQUIREMENTS:\n${description.trim()}\n- Incorporate these specific preferences while maintaining the overall styling guidelines and occasion appropriateness\n- Balance user preferences with the provided reference items and occasion requirements\n`
      : '';

    const prompt = `You are an expert fashion stylist AI specializing in creating sophisticated, occasion-appropriate outfits. Generate a high-quality, full-body image of an elegant female model styled for: ${occasion}.

    ${itemInstructions}
    ${descriptionSection}
    CRITICAL INSTRUCTIONS:
    - For items with reference images: REPLICATE them exactly as shown (colors, patterns, style, fit)
    - For missing items: CREATE complementary pieces that work harmoniously with the provided items
    - Ensure all generated items are appropriate for the specified occasion: ${occasion}
    - Maintain color coordination and style consistency across all items
    - If only some items are provided, make sure the AI-generated items complement and enhance the user's choices
    ${description && description.trim() ? `- Incorporate the user's styling preferences: "${description.trim()}" while maintaining occasion appropriateness` : ''}

    VISUAL SPECIFICATIONS:
    - Model pose: Confident, natural stance with good posture
    - Styling: Ensure proper fit, color coordination, and seasonal appropriateness
    - Aesthetic: Modern, polished, and fashion-forward appearance
    - Background: Clean, minimalist backdrop in neutral tones (white, light gray, or soft beige)
    - Lighting: Professional studio lighting with soft shadows to highlight outfit details
    - Image quality: High-resolution, sharp focus on clothing details and overall composition

    DESIGN PRINCIPLES:
    - Maintain elegance and sophistication appropriate for ${occasion}
    - Ensure color harmony and balanced proportions between provided and generated items
    - Consider current fashion trends while maintaining timeless appeal
    - Focus on creating a cohesive, well-curated look from head to toe
    - The final outfit should look intentionally styled, not like random pieces put together
    ${description && description.trim() ? `- Reflect the user's personal style preferences: "${description.trim()}" in the overall aesthetic` : ''}

    Style the model to embody confidence and grace, showcasing how this complete outfit would look for ${occasion}${description && description.trim() ? ` with the requested styling approach` : ''}.`;

    // Convert only the good items to base64 format
    const imageParts = await Promise.all(
      goodItems.map(item => fetchImageAsBase64(item.url))
    );

    // Create content parts - starting with text prompt
    const parts = [{ text: prompt }];

    // Add image parts for the good items only
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
      model: "gemini-2.0-flash-exp",
      contents: [contents],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    // Extract the generated image
    const resultPart = result.candidates[0].content.parts;
    const imagePart = resultPart.find(p => p.inlineData);

    return imagePart.inlineData.data
      ? `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
      : null;
  } catch (error) {
      console.error("Error generating mannequin image:", error);
      throw error;
  }
}