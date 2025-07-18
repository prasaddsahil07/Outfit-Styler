// import { ai } from "../index.js";
// import { createUserContent, Modality } from "@google/genai";

// // Utility: convert an image URL to base64 inline data
// async function fetchImageAsBase64(url) {
//   try {
//     const response = await fetch(url);
//     if (!response.ok) {
//       throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
//     }
//     const buffer = await response.arrayBuffer();
//     const contentType = response.headers.get("content-type") || "image/png";
//     return {
//       mimeType: contentType,
//       data: Buffer.from(buffer).toString("base64"),
//     };
//   } catch (error) {
//     console.error(`Error fetching image from ${url}:`, error);
//     throw error;
//   }
// }

// export async function generateModelImage(imageUrls, occasion, badItemImages = [], description = "", req) {
//   try {
//     const [top, bottom, accessory, footwear] = imageUrls;
//     const labels = ['Topwear', 'Bottomwear', 'Accessory', 'Footwear'];

//     const userBodyShape = req.user.userBodyInfo.bodyShape || "";
//     const userUnderTone = req.user.userBodyInfo.undertone || "";

//     // Set default height for women if not provided (average women's height: 5'4")
//     const userHeight = req.user.userBodyInfo.height &&
//       (req.user.userBodyInfo.height.feet > 0 || req.user.userBodyInfo.height.inches > 0)
//       ? req.user.userBodyInfo.height
//       : { feet: 5, inches: 4 };

//     // Format height for better readability
//     const heightString = `${userHeight.feet}'${userHeight.inches}"`;

//     // Build user profile section for the prompt
//     const userProfile = `
// 👤 USER PROFILE FOR MODEL REPRESENTATION:
// - Body Shape: ${userBodyShape || 'Balanced proportions'}
// - Height: ${heightString}
// - Skin Undertone: ${userUnderTone || 'Neutral'}

// 🎯 MODEL REQUIREMENTS:
// - Generate a realistic female model that represents the user's body type and proportions
// - Show how the outfit would look on someone with the user's specific body shape
// - Use the undertone information for better color coordination in styling
// - Ensure the model's height and body proportions match the user's profile for accurate visualization`;

//     // Filter out bad items - only use good items for AI generation
//     const goodItems = imageUrls.map((url, index) => ({
//       url,
//       label: labels[index],
//       isGood: url && !badItemImages.includes(url)
//     })).filter(item => item.url && item.isGood);

//     // Identify what items we have vs what we need AI to generate
//     const hasTop = goodItems.some(item => item.label === 'Topwear');
//     const hasBottom = goodItems.some(item => item.label === 'Bottomwear');
//     const hasAccessory = goodItems.some(item => item.label === 'Accessory');
//     const hasFootwear = goodItems.some(item => item.label === 'Footwear');

//     // Build dynamic prompt based on what user provided vs what AI needs to generate
//     let itemInstructions = "OUTFIT COMPOSITION:\n";

//     if (hasTop) {
//       itemInstructions += "• Topwear: USE the exact topwear shown in the reference image - match its style, color, and design precisely\n";
//     } else {
//       itemInstructions += `• Topwear: GENERATE appropriate topwear for ${occasion} that complements the provided items\n`;
//     }

//     if (hasBottom) {
//       itemInstructions += "• Bottomwear: USE the exact bottomwear shown in the reference image - match its style, color, and design precisely\n";
//     } else {
//       itemInstructions += `• Bottomwear: GENERATE appropriate bottomwear for ${occasion} that complements the provided items\n`;
//     }

//     if (hasFootwear) {
//       itemInstructions += "• Footwear: USE the exact footwear shown in the reference image - match its style, color, and design precisely\n";
//     } else {
//       itemInstructions += `• Footwear: GENERATE appropriate footwear for ${occasion} that complements the provided items\n`;
//     }

//     if (hasAccessory) {
//       itemInstructions += "• Accessories: USE the exact accessories shown in the reference image - match their style, color, and design precisely\n";
//     } else {
//       itemInstructions += `• Accessories: GENERATE tasteful accessories for ${occasion} that enhance the overall look\n`;
//     }

//     // Build description section for the prompt
//     const descriptionSection = description && description.trim()
//       ? `\nADDITIONAL STYLING REQUIREMENTS:\n${description.trim()}\n- Incorporate these specific preferences while maintaining the overall styling guidelines and occasion appropriateness\n- Balance user preferences with the provided reference items and occasion requirements\n`
//       : '';

//     const prompt = `You are an expert fashion stylist AI and professional image generator specializing in creating sophisticated, occasion-appropriate outfits with realistic model representation.

// Generate a high-quality, full-body image of a female model styled for: ${occasion}.

// ${userProfile}

// ${itemInstructions}
// ${descriptionSection}

// CRITICAL INSTRUCTIONS:
// - For items with reference images: REPLICATE them exactly as shown (colors, patterns, style, fit)
// - For missing items: CREATE complementary pieces that work harmoniously with the provided items
// - Ensure all generated items are appropriate for the specified occasion: ${occasion}
// - Maintain color coordination and style consistency across all items
// - Consider the user's undertone (${userUnderTone || 'neutral'}) when selecting colors for generated items
// - If only some items are provided, make sure the AI-generated items complement and enhance the user's choices
// ${description && description.trim() ? `- Incorporate the user's styling preferences: "${description.trim()}" while maintaining occasion appropriateness` : ''}

// VISUAL SPECIFICATIONS:
// - Generate a realistic female model with ${userBodyShape || 'balanced'} body shape and ${heightString} height proportions
// - The model should represent how the outfit would realistically look on someone with the user's body type
// - Model pose: Confident, natural stance with good posture that showcases the outfit on the specific body shape
// - Styling: Ensure proper fit that flatters the user's body shape, with attention to proportions
// - Aesthetic: Modern, polished, and fashion-forward appearance suitable for the user's body type
// - Background: Clean, minimalist backdrop in neutral tones (white, light gray, or soft beige)
// - Lighting: Professional studio lighting with soft shadows to highlight outfit details and body silhouette
// - Image quality: High-resolution, sharp focus on clothing details and overall composition

// BODY-SPECIFIC STYLING FOCUS:
// - Demonstrate how the outfit flatters the ${userBodyShape || 'balanced'} body shape
// - Show proper proportions and fit for someone of ${heightString} height
// - Ensure the styling choices work well with the user's body type for a realistic preview
// - Focus on creating a look that the user would actually achieve with their body characteristics

// DESIGN PRINCIPLES:
// - Maintain elegance and sophistication appropriate for ${occasion}
// - Ensure color harmony that works with ${userUnderTone || 'neutral'} undertones
// - Consider balanced proportions between provided and generated items for the user's body type
// - Consider current fashion trends while maintaining timeless appeal
// - Focus on creating a cohesive, well-curated look that works specifically for the user's body shape
// - The final outfit should look intentionally styled for the user's body type, not generic styling
// ${description && description.trim() ? `- Reflect the user's personal style preferences: "${description.trim()}" in the overall aesthetic` : ''}

// PERSONALIZATION GOAL:
// Create a realistic visualization showing how the complete outfit would look on someone with the user's exact body specifications (${userBodyShape || 'balanced'} shape, ${heightString} height, ${userUnderTone || 'neutral'} undertone), providing an accurate and personalized preview of the styled look.

// Style the model to embody confidence and grace while accurately representing the user's body type, showcasing how this complete outfit would realistically look for ${occasion}${description && description.trim() ? ` with the requested styling approach` : ''}.`;

//     // Convert only the good items to base64 format
//     const imageParts = await Promise.all(
//       goodItems.map(item => fetchImageAsBase64(item.url))
//     );

//     // Create content parts - starting with text prompt
//     const parts = [{ text: prompt }];

//     // Add image parts for the good items only
//     for (const image of imageParts) {
//       parts.push({
//         inlineData: {
//           mimeType: image.mimeType,
//           data: image.data,
//         },
//       });
//     }

//     const contents = createUserContent(parts);

//     const result = await ai.models.generateContent({
//       model: "gemini-2.0-flash-exp",
//       contents: [contents],
//       config: {
//         responseModalities: [Modality.TEXT, Modality.IMAGE],
//         temperature: 0.7,
//         topP: 0.9,
//       },
//     });

//     // Extract the generated image
//     const resultPart = result.candidates[0].content.parts;
//     const imagePart = resultPart.find(p => p.inlineData);

//     return imagePart.inlineData?.data
//       ? { type: "uploaded_image", imageB64: 'imagePart.inlineData.data' }
//       : null;

//   } catch (error) {
//     console.error("Error generating model image:", error);
//     throw error;
//   }
// }







import { ai } from "../index.js";
import { createUserContent, Modality } from "@google/genai";
import sharp from 'sharp';

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
      buffer: Buffer.from(buffer)
    };
  } catch (error) {
    console.error(`Error fetching image from ${url}:`, error);
    throw error;
  }
}

// Utility: fetch image as buffer for processing
async function fetchImageBuffer(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error(`Error fetching image buffer from ${url}:`, error);
    throw error;
  }
}

// Step 1: Generate base model with missing clothing items only
async function generateBaseModel(missingItems, occasion, userProfile, description) {
  if (missingItems.length === 0) {
    // If no missing items, generate a basic model in undergarments/base layer
    const prompt = `Generate a realistic female model for clothing fitting purposes.

${userProfile}

REQUIREMENTS:
- Model in neutral undergarments or base layer clothing (bra, underwear, or basic fitted clothing)
- Clean, professional studio background (white or light gray)
- Natural, confident pose with arms slightly away from body for clothing overlay
- Professional studio lighting with minimal shadows
- Full body shot, straight-on angle
- High resolution and sharp focus
- Model should represent the specified body type accurately
- Ensure proper proportions for ${userProfile.height} height

STYLING:
- Minimal, neutral base layer that won't interfere with clothing overlay
- Natural makeup and hair styling
- Clean, modern aesthetic suitable for fashion fitting
- Focus on accurate body representation for clothing visualization`;

    const contents = createUserContent([{ text: prompt }]);
    
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [contents],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        temperature: 0.3,
        topP: 0.8,
      },
    });

    const resultPart = result.candidates[0].content.parts;
    const imagePart = resultPart.find(p => p.inlineData);
    
    return imagePart.inlineData?.data ? Buffer.from(imagePart.inlineData.data, 'base64') : null;
  }

  // Generate only the missing items
  const itemDescriptions = missingItems.map(item => {
    switch(item) {
      case 'Topwear':
        return `• Topwear: Generate appropriate ${occasion} topwear that will complement other provided items`;
      case 'Bottomwear':
        return `• Bottomwear: Generate appropriate ${occasion} bottomwear that will complement other provided items`;
      case 'Footwear':
        return `• Footwear: Generate appropriate ${occasion} footwear that will complement other provided items`;
      case 'Accessory':
        return `• Accessories: Generate tasteful ${occasion} accessories that enhance the overall look`;
      default:
        return '';
    }
  }).join('\n');

  const prompt = `Generate a realistic female model wearing only the following items for ${occasion}:

${userProfile}

ITEMS TO GENERATE:
${itemDescriptions}

CRITICAL INSTRUCTIONS:
- Generate ONLY the specified missing items listed above
- Leave space/accommodation for items that will be added later via image compositing
- Ensure all generated items are appropriate for: ${occasion}
- Use colors and styles that will work well with a variety of other clothing items
- Consider the user's undertone when selecting colors
${description ? `- Incorporate styling preferences: "${description}"` : ''}

VISUAL SPECIFICATIONS:
- Generate a realistic female model with the specified body shape and height proportions
- Model pose: Natural, confident stance with good posture suitable for clothing overlay
- Background: Clean, neutral studio backdrop (white or light gray)
- Lighting: Professional studio lighting with soft, even illumination
- Image quality: High-resolution, sharp focus
- Ensure proper fit for the specified body type

COMPOSITION FOCUS:
- Create a foundation that will work well with image compositing
- Ensure generated items complement rather than compete with items to be added later
- Maintain professional fashion photography standards`;

  const contents = createUserContent([{ text: prompt }]);
  
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: [contents],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      temperature: 0.4,
      topP: 0.8,
    },
  });

  const resultPart = result.candidates[0].content.parts;
  const imagePart = resultPart.find(p => p.inlineData);
  
  return imagePart.inlineData?.data ? Buffer.from(imagePart.inlineData.data, 'base64') : null;
}

// Step 2: Process and prepare clothing items for compositing
async function preprocessClothingItem(imageBuffer, itemType, targetDimensions) {
  try {
    // Remove background and enhance for compositing
    const processedImage = await sharp(imageBuffer)
      .resize(targetDimensions.width, targetDimensions.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png() // Convert to PNG for transparency support
      .toBuffer();

    return processedImage;
  } catch (error) {
    console.error(`Error preprocessing ${itemType}:`, error);
    return imageBuffer; // Return original if processing fails
  }
}

// Step 3: Composite clothing items onto base model
async function compositeClothingItems(baseModelBuffer, clothingItems) {
  try {
    let compositeImage = sharp(baseModelBuffer);
    
    // Define positioning for different clothing types
    const positions = {
      'Topwear': { top: 150, left: 100 },
      'Bottomwear': { top: 350, left: 120 },
      'Footwear': { top: 650, left: 140 },
      'Accessory': { top: 100, left: 150 }
    };

    // Get base image dimensions
    const baseMetadata = await sharp(baseModelBuffer).metadata();
    const baseWidth = baseMetadata.width;
    const baseHeight = baseMetadata.height;

    // Composite each clothing item
    for (const item of clothingItems) {
      const position = positions[item.type] || { top: 0, left: 0 };
      
      // Adjust positioning based on image size
      const adjustedPosition = {
        top: Math.round(position.top * (baseHeight / 800)),
        left: Math.round(position.left * (baseWidth / 600))
      };

      // Preprocess the clothing item
      const targetDimensions = {
        width: Math.round(baseWidth * 0.4), // 40% of base width
        height: Math.round(baseHeight * 0.3) // 30% of base height
      };

      const processedItem = await preprocessClothingItem(
        item.buffer, 
        item.type, 
        targetDimensions
      );

      // Composite the item onto the base
      compositeImage = compositeImage.composite([{
        input: processedItem,
        top: adjustedPosition.top,
        left: adjustedPosition.left,
        blend: 'over'
      }]);
    }

    return await compositeImage.png().toBuffer();
  } catch (error) {
    console.error("Error compositing clothing items:", error);
    throw error;
  }
}

// Step 4: Apply final enhancement and styling
async function enhanceFinalImage(compositeBuffer, occasion, userProfile) {
  try {
    // Apply final enhancements
    const enhanced = await sharp(compositeBuffer)
      .sharpen()
      .normalize()
      .png()
      .toBuffer();

    return enhanced;
  } catch (error) {
    console.error("Error enhancing final image:", error);
    return compositeBuffer; // Return original if enhancement fails
  }
}

// Main function with high-accuracy preservation
export async function generateModelImage(imageUrls, occasion, badItemImages = [], description = "", req) {
  try {
    const [top, bottom, accessory, footwear] = imageUrls;
    const labels = ['Topwear', 'Bottomwear', 'Accessory', 'Footwear'];

    const userBodyShape = req.user.userBodyInfo.bodyShape || "";
    const userUnderTone = req.user.userBodyInfo.undertone || "";

    // Set default height for women if not provided
    const userHeight = req.user.userBodyInfo.height &&
      (req.user.userBodyInfo.height.feet > 0 || req.user.userBodyInfo.height.inches > 0)
      ? req.user.userBodyInfo.height
      : { feet: 5, inches: 4 };

    const heightString = `${userHeight.feet}'${userHeight.inches}"`;

    // Build user profile
    const userProfile = {
      bodyShape: userBodyShape || 'Balanced proportions',
      height: heightString,
      undertone: userUnderTone || 'Neutral',
      profileText: `
👤 USER PROFILE FOR MODEL REPRESENTATION:
- Body Shape: ${userBodyShape || 'Balanced proportions'}
- Height: ${heightString}
- Skin Undertone: ${userUnderTone || 'Neutral'}

🎯 MODEL REQUIREMENTS:
- Generate a realistic female model that represents the user's body type and proportions
- Show accurate body shape representation for clothing visualization
- Use the undertone information for better color coordination
- Ensure the model's height and body proportions match the user's profile`
    };

    // Identify provided vs missing items
    const providedItems = [];
    const missingItems = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      const label = labels[i];
      
      if (url && !badItemImages.includes(url)) {
        // Item is provided and good
        const buffer = await fetchImageBuffer(url);
        providedItems.push({
          type: label,
          buffer: buffer,
          url: url
        });
      } else {
        // Item is missing or bad
        missingItems.push(label);
      }
    }

    console.log(`Provided items: ${providedItems.map(i => i.type).join(', ')}`);
    console.log(`Missing items: ${missingItems.join(', ')}`);

    // Step 1: Generate base model with missing items only
    const baseModelBuffer = await generateBaseModel(missingItems, occasion, userProfile, description);
    
    if (!baseModelBuffer) {
      throw new Error("Failed to generate base model");
    }

    // Step 2: If we have provided items, composite them onto the base
    let finalImageBuffer;
    if (providedItems.length > 0) {
      finalImageBuffer = await compositeClothingItems(baseModelBuffer, providedItems);
    } else {
      finalImageBuffer = baseModelBuffer;
    }

    // Step 3: Apply final enhancements
    const enhancedImageBuffer = await enhanceFinalImage(finalImageBuffer, occasion, userProfile);

    // Convert to base64 for return
    const finalBase64 = enhancedImageBuffer.toString('base64');

    return {
      type: "uploaded_image",
      imageB64: finalBase64,
      // preservationMethod: "image_compositing",
      // itemsPreserved: providedItems.map(i => i.type),
      // itemsGenerated: missingItems
    };

  } catch (error) {
    console.error("Error generating model image with high accuracy:", error);
    throw error;
  }
}