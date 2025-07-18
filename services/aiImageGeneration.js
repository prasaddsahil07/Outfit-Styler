// import { ai } from "../index.js";

// export const generateAIFashionSuggestions = async (imageUrls, occasion, numberOfImages = 3, description = "", req) => {
//     try {
//         const userBodyShape = req.user?.userBodyInfo?.bodyShape || "";
//         const userUnderTone = req.user?.userBodyInfo?.undertone || "";

//         // Set default height for women if not provided (average women's height: 5'4")
//         const userHeight = req.user?.userBodyInfo?.height &&
//             (req.user.userBodyInfo.height.feet > 0 || req.user.userBodyInfo.height.inches > 0)
//             ? req.user.userBodyInfo.height
//             : { feet: 5, inches: 4 };

//         // Build height description for the prompt
//         const heightDescription = `${userHeight.feet}'${userHeight.inches}"`;

//         // Build body shape styling guidelines
//         const getBodyShapeGuidelines = (bodyShape) => {
//             const guidelines = {
//                 'pear': 'Focus on balancing proportions by highlighting the upper body, using A-line silhouettes, and choosing tops that draw attention upward',
//                 'apple': 'Emphasize the legs and neckline, use empire waists, flowing fabrics, and avoid tight-fitting tops around the midsection',
//                 'hourglass': 'Highlight the natural waistline with fitted silhouettes, wrap styles, and tailored pieces that showcase the balanced proportions',
//                 'rectangle': 'Create curves and definition with layering, belted waists, peplum styles, and pieces that add volume to hips and bust',
//                 'inverted triangle': 'Balance broad shoulders with wider bottom silhouettes, bootcut pants, A-line skirts, and softer shoulder lines'
//             };
//             return guidelines[bodyShape.toLowerCase()] || 'Focus on creating flattering, well-fitted silhouettes that enhance natural proportions';
//         };

//         // Build undertone color guidelines
//         const getUndertoneColorGuidelines = (undertone) => {
//             const colorGuidelines = {
//                 'warm': 'Use warm colors like coral, peach, golden yellow, warm reds, olive green, and cream. Avoid cool-toned colors like icy blues or stark whites',
//                 'cool': 'Use cool colors like navy blue, emerald green, royal purple, true red, and crisp whites. Avoid warm yellows, oranges, or golden tones',
//                 'neutral': 'Can wear both warm and cool colors effectively. Focus on colors that complement the occasion and outfit aesthetic'
//             };
//             return colorGuidelines[undertone.toLowerCase()] || 'Choose colors that complement the skin tone and enhance the overall look';
//         };

//         // Build description section for the prompt
//         const descriptionSection = description && description.trim()
//             ? `\n📝 ADDITIONAL STYLING REQUIREMENTS:\n- ${description.trim()}\n- Incorporate these specific preferences across all ${numberOfImages} outfits while maintaining variety\n- Balance user preferences with occasion appropriateness and outfit diversity\n- Let the description influence the overall aesthetic direction of all looks\n`
//             : '';

//         // Build personalization section
//         const personalizationSection = `
// 🧍‍♀️ USER PERSONALIZATION (CRITICAL - Apply to ALL outfits):
// ${userBodyShape ? `- Body Shape: ${userBodyShape} - ${getBodyShapeGuidelines(userBodyShape)}` : ''}
// ${userUnderTone ? `- Skin Undertone: ${userUnderTone} - ${getUndertoneColorGuidelines(userUnderTone)}` : ''}
// - Height: ${heightDescription} - Choose proportions and lengths that flatter this height
// - All styling choices must consider these physical characteristics for maximum flattery
// - Each outfit should be optimized for this specific body type and coloring
// `;

//         // Build model appearance section
//         const modelAppearanceSection = `
// 👤 MODEL APPEARANCE REQUIREMENTS:
// - Generate a photorealistic female model with these characteristics:
//   ${userHeight ? `- Height: ${heightDescription} (adjust proportions accordingly)` : ''}
//   ${userBodyShape ? `- Body shape: ${userBodyShape} body type with natural, realistic proportions` : ''}
//   ${userUnderTone ? `- Skin tone: Natural ${userUnderTone} undertone complexion` : ''}
// - Model should have a natural, approachable appearance
// - Professional but relatable fashion model aesthetic
// - Consistent model appearance across all ${numberOfImages} generated images
// `;

//         const aiPrompt = `
// ROLE: You are a professional fashion stylist creating complete, full-body styled outfits for a personalized fashion editorial campaign, with expertise in both contemporary and traditional Indian ethnic wear.

// OBJECTIVE:
// Design ${numberOfImages} distinct cohesive outfits perfect for a **${occasion}** setting, specifically tailored for the user's body characteristics. Create complete looks styled on a model that represents the user's physical attributes.
// ${descriptionSection}
// ${personalizationSection}

// ✅ OUTFIT STRUCTURE (for each look):
// ${occasion && (occasion.toLowerCase().includes('festival') || occasion.toLowerCase().includes('wedding') || occasion.toLowerCase().includes('diwali') || occasion.toLowerCase().includes('holi') || occasion.toLowerCase().includes('navratri') || occasion.toLowerCase().includes('durga puja') || occasion.toLowerCase().includes('karva chauth') || occasion.toLowerCase().includes('indian') || occasion.toLowerCase().includes('ethnic') || occasion.toLowerCase().includes('traditional')) ? `
// **For Indian Festive/Traditional Occasions:**
// - Include EXACTLY ONE complete ethnic outfit with:
//   - One main garment: Saree with blouse, Lehenga choli, Anarkali suit, Sharara set, Palazzo suit, Indo-western fusion wear, or Churidar kurta set
//   - Traditional footwear: Juttis, kolhapuris, wedges, or embellished heels
//   - 2–4 traditional accessories: Statement jewelry (necklace, earrings, bangles), potli bag/clutch, dupatta (if applicable), maang tikka, nose ring, or traditional hair accessories
//   - Optional: Traditional makeup elements like bindi, kajal, or mehendi patterns

// **Ethnic Wear Styling Guidelines:**
// - Focus on rich fabrics: silk, brocade, chiffon, georgette, velvet, or cotton with traditional prints
// - Incorporate traditional Indian colors: deep jewel tones, metallics, vibrant festival colors, or elegant pastels
// - Include authentic Indian embellishments: zardozi, mirror work, thread embroidery, sequins, or block prints
// - Ensure proper draping and fit for traditional garments
// - Balance traditional elements with contemporary styling where appropriate
// ` : `
// **For Contemporary/Western Occasions:**
// - Include EXACTLY ONE complete outfit with:
//   - One topwear (shirt, blouse, t-shirt, sweater, etc.)
//   - One bottomwear (pants, skirt, shorts, etc.) OR a dress (if dress, no separate top/bottom needed)
//   - One pair of shoes
//   - 2–3 accessories (bag, hat, jewelry, belt, scarf – choose what fits the occasion)
// `}

// 🎨 STYLING FOCUS:
// - Each outfit must be appropriate and stylish for **${occasion}**
// - Make each look distinctly different in style, color palette, and approach
// - Consider the formality level and aesthetic that suits this occasion
// - Focus on creating cohesive, well-coordinated looks that FLATTER the user's specific body type
// - Ensure variety between the ${numberOfImages} different outfits
// ${userBodyShape ? `- All silhouettes and fits must be optimized for ${userBodyShape} body shape` : ''}
// ${userUnderTone ? `- All color choices must complement ${userUnderTone} undertones` : ''}
// ${description && description.trim() ? `- Reflect the styling preferences: "${description.trim()}" in each of the ${numberOfImages} looks while maintaining distinct differences between them` : ''}

// ${modelAppearanceSection}

// 🖼️ VISUAL OUTPUT FORMAT:
// - **FULL-SIZE, HIGH-RESOLUTION IMAGES** - Generate complete, detailed fashion editorial images
// - Each outfit styled on the personalized photorealistic human model
// - **FULL-BODY MODEL SHOTS** - Show entire outfit from head to toe clearly
// - Professional editorial photography look with studio-quality lighting
// - Clean and neutral background (white, cream, or subtle gradient)
// - Model should be positioned to showcase the complete outfit effectively
// - **IMAGE DIMENSIONS**: Generate wide, full-resolution images that capture all styling details
// - Model should consistently represent the user's physical characteristics across all images
// - Show fabric textures, embellishments, and styling details clearly
// ${description && description.trim() ? `- Ensure the overall visual aesthetic aligns with: "${description.trim()}"` : ''}

// ${occasion && (occasion.toLowerCase().includes('festival') || occasion.toLowerCase().includes('wedding') || occasion.toLowerCase().includes('diwali') || occasion.toLowerCase().includes('holi') || occasion.toLowerCase().includes('navratri') || occasion.toLowerCase().includes('durga puja') || occasion.toLowerCase().includes('karva chauth') || occasion.toLowerCase().includes('indian') || occasion.toLowerCase().includes('ethnic') || occasion.toLowerCase().includes('traditional')) ? `
// **Additional Visual Requirements for Indian Ethnic Wear:**
// - Showcase traditional draping techniques (saree pleats, dupatta styling)
// - Highlight intricate embroidery, embellishments, and fabric details
// - Include traditional jewelry styling and placement
// - Show authentic color combinations and pattern mixing
// - Capture the elegance and richness of Indian traditional wear
// - Ensure cultural authenticity and respectful representation
// ` : ''}

// 🚫 ABSOLUTE RULES:
// - Generate exactly ${numberOfImages} distinct outfit looks
// - **MANDATORY**: All images must be FULL-SIZE and HIGH-RESOLUTION
// - No styling alternatives within each look
// - No text overlays or descriptions on images
// - Focus on showcasing realistic, wearable outfits
// - Model must consistently reflect the specified physical characteristics
// - All outfit choices must be flattering for the specified body type and coloring
// - **Ensure complete outfit visibility** - no cropping of important styling elements
// ${description && description.trim() ? `- All outfits should harmonize with the user's style direction while being distinctly different from each other` : ''}
// ${occasion && (occasion.toLowerCase().includes('festival') || occasion.toLowerCase().includes('wedding') || occasion.toLowerCase().includes('diwali') || occasion.toLowerCase().includes('holi') || occasion.toLowerCase().includes('navratri') || occasion.toLowerCase().includes('durga puja') || occasion.toLowerCase().includes('karva chauth') || occasion.toLowerCase().includes('indian') || occasion.toLowerCase().includes('ethnic') || occasion.toLowerCase().includes('traditional')) ? `
// - Maintain cultural sensitivity and authenticity in ethnic wear representation
// - Ensure traditional garments are styled correctly and respectfully
// ` : ''}

// ✨ GOAL:
// Deliver ${numberOfImages} distinct and editorial-quality complete outfits suitable for the **${occasion}** setting, each styled professionally on a female model who represents the user's physical characteristics${userBodyShape ? ` (${userBodyShape} body shape)` : ''}${userUnderTone ? ` with ${userUnderTone} undertones` : ''} at ${heightDescription} height${description && description.trim() ? `, with styling that reflects: "${description.trim()}"` : ''}. 

// ${occasion && (occasion.toLowerCase().includes('festival') || occasion.toLowerCase().includes('wedding') || occasion.toLowerCase().includes('diwali') || occasion.toLowerCase().includes('holi') || occasion.toLowerCase().includes('navratri') || occasion.toLowerCase().includes('durga puja') || occasion.toLowerCase().includes('karva chauth') || occasion.toLowerCase().includes('indian') || occasion.toLowerCase().includes('ethnic') || occasion.toLowerCase().includes('traditional')) ? `
// **Special Focus**: Create authentic, beautiful Indian ethnic wear looks that celebrate traditional craftsmanship while ensuring modern styling sensibilities and perfect fit for the user's body type.
// ` : ''}

// **IMAGE QUALITY MANDATE**: All generated images must be full-resolution, professional-quality fashion editorial photographs that showcase every styling detail clearly and beautifully.
// `;

//         const aiResponse = await ai.models.generateContent({
//             model: "gemini-2.0-flash-preview-image-generation",
//             contents: aiPrompt,
//             config: {
//                 responseModalities: ["TEXT", "IMAGE"],
//                 numberOfImages: numberOfImages,
//             },
//         });

//         // Extract AI generated images
//         const generatedImages = [];
//         let aiImageCount = 0;

//         for (const part of aiResponse.candidates[0].content.parts) {
//             if (part.inlineData) {
//                 aiImageCount++;
//                 generatedImages.push({
//                     type: 'ai_suggestion',
//                     imageB64: 'part.inlineData.data'
//                 });
//             }
//         }

//         return {
//             success: true,
//             imageB64: generatedImages,
//             // totalGenerated: generatedImages.length
//         };

//     } catch (error) {
//         console.error('Error generating AI fashion suggestions:', error);
//         return {
//             success: false,
//             error: error.message,
//             data: []
//         };
//     }
// };
















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

// Generate base model with missing clothing items only
async function generateBaseModel(missingItems, providedItems, occasion, userProfile, description, suggestionNumber) {
  // Build dynamic prompt based on what user provided vs what AI needs to generate
  let itemInstructions = "OUTFIT COMPOSITION:\n";
  
  const providedItemTypes = providedItems.map(item => item.type);
  
  if (providedItemTypes.includes('Topwear')) {
    itemInstructions += "• Topwear: USE the exact topwear shown in the reference image - match its style, color, and design precisely\n";
  } else if (missingItems.includes('Topwear')) {
    itemInstructions += `• Topwear: GENERATE appropriate topwear for ${occasion} that complements the provided items\n`;
  }

  if (providedItemTypes.includes('Bottomwear')) {
    itemInstructions += "• Bottomwear: USE the exact bottomwear shown in the reference image - match its style, color, and design precisely\n";
  } else if (missingItems.includes('Bottomwear')) {
    itemInstructions += `• Bottomwear: GENERATE appropriate bottomwear for ${occasion} that complements the provided items\n`;
  }

  if (providedItemTypes.includes('Footwear')) {
    itemInstructions += "• Footwear: USE the exact footwear shown in the reference image - match its style, color, and design precisely\n";
  } else if (missingItems.includes('Footwear')) {
    itemInstructions += `• Footwear: GENERATE appropriate footwear for ${occasion} that complements the provided items\n`;
  }

  if (providedItemTypes.includes('Accessory')) {
    itemInstructions += "• Accessories: USE the exact accessories shown in the reference image - match their style, color, and design precisely\n";
  } else if (missingItems.includes('Accessory')) {
    itemInstructions += `• Accessories: GENERATE tasteful accessories for ${occasion} that enhance the overall look\n`;
  }

  // Build description section for the prompt
  const descriptionSection = description && description.trim()
    ? `\nADDITIONAL STYLING REQUIREMENTS (Suggestion ${suggestionNumber}):\n${description.trim()}\n- Incorporate these specific preferences while maintaining the overall styling guidelines and occasion appropriateness\n- Balance user preferences with the provided reference items and occasion requirements\n- For suggestion ${suggestionNumber}, create a unique interpretation of these preferences\n`
    : `\nSTYLING VARIATION ${suggestionNumber}:\n- Create a unique styling approach for this suggestion while maintaining occasion appropriateness\n- Ensure this look is distinctly different from other suggestions\n`;

  const prompt = `You are an expert fashion stylist AI creating outfit suggestion ${suggestionNumber} for: ${occasion}.

${userProfile.profileText}

${itemInstructions}
${descriptionSection}

CRITICAL INSTRUCTIONS:
- For items with reference images: REPLICATE them exactly as shown (colors, patterns, style, fit)
- For missing items: CREATE complementary pieces that work harmoniously with the provided items
- For suggestion ${suggestionNumber}: Create a unique styling interpretation that's different from other suggestions
- Ensure all generated items are appropriate for the specified occasion: ${occasion}
- Maintain color coordination and style consistency across all items
- Consider the user's undertone (${userProfile.undertone}) when selecting colors for generated items
- If only some items are provided, make sure the AI-generated items complement and enhance the user's choices

VISUAL SPECIFICATIONS:
- Generate a realistic female model with ${userProfile.bodyShape} body shape and ${userProfile.height} height proportions
- The model should represent how the outfit would realistically look on someone with the user's body type
- Model pose: Confident, natural stance with good posture that showcases the outfit on the specific body shape
- Styling: Ensure proper fit that flatters the user's body shape, with attention to proportions
- Aesthetic: Modern, polished, and fashion-forward appearance suitable for the user's body type
- Background: Clean, minimalist backdrop in neutral tones (white, light gray, or soft beige)
- Lighting: Professional studio lighting with soft shadows to highlight outfit details and body silhouette
- Image quality: High-resolution, sharp focus on clothing details and overall composition

BODY-SPECIFIC STYLING FOCUS:
- Demonstrate how the outfit flatters the ${userProfile.bodyShape} body shape
- Show proper proportions and fit for someone of ${userProfile.height} height
- Ensure the styling choices work well with the user's body type for a realistic preview
- Focus on creating a look that the user would actually achieve with their body characteristics

SUGGESTION ${suggestionNumber} UNIQUE APPROACH:
- Make this suggestion distinctly different in styling approach from other suggestions
- Vary color palettes, styling techniques, or accessory choices while maintaining occasion appropriateness
- Create variety in silhouettes, textures, or overall aesthetic while respecting provided items

DESIGN PRINCIPLES:
- Maintain elegance and sophistication appropriate for ${occasion}
- Ensure color harmony that works with ${userProfile.undertone} undertones
- Consider balanced proportions between provided and generated items for the user's body type
- Consider current fashion trends while maintaining timeless appeal
- Focus on creating a cohesive, well-curated look that works specifically for the user's body shape
- The final outfit should look intentionally styled for the user's body type, not generic styling

PERSONALIZATION GOAL:
Create a realistic visualization showing how this complete outfit would look on someone with the user's exact body specifications (${userProfile.bodyShape} shape, ${userProfile.height} height, ${userProfile.undertone} undertone), providing an accurate and personalized preview of styled look suggestion ${suggestionNumber}.

Style the model to embody confidence and grace while accurately representing the user's body type, showcasing how this complete outfit would realistically look for ${occasion}.`;

  // Create content parts - starting with text prompt
  const parts = [{ text: prompt }];

  // Add image parts for the provided items only
  for (const item of providedItems) {
    const imageData = await fetchImageAsBase64(item.url);
    parts.push({
      inlineData: {
        mimeType: imageData.mimeType,
        data: imageData.data,
      },
    });
  }

  const contents = createUserContent(parts);

  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: [contents],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      temperature: 0.7,
      topP: 0.9,
    },
  });

  const resultPart = result.candidates[0].content.parts;
  const imagePart = resultPart.find(p => p.inlineData);
  
  return imagePart.inlineData?.data ? Buffer.from(imagePart.inlineData.data, 'base64') : null;
}

// Process and prepare clothing items for compositing
async function preprocessClothingItem(imageBuffer, itemType, targetDimensions) {
  try {
    const processedImage = await sharp(imageBuffer)
      .resize(targetDimensions.width, targetDimensions.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png()
      .toBuffer();

    return processedImage;
  } catch (error) {
    console.error(`Error preprocessing ${itemType}:`, error);
    return imageBuffer;
  }
}

// Composite clothing items onto base model
async function compositeClothingItems(baseModelBuffer, clothingItems) {
  try {
    let compositeImage = sharp(baseModelBuffer);
    
    const positions = {
      'Topwear': { top: 150, left: 100 },
      'Bottomwear': { top: 350, left: 120 },
      'Footwear': { top: 650, left: 140 },
      'Accessory': { top: 100, left: 150 }
    };

    const baseMetadata = await sharp(baseModelBuffer).metadata();
    const baseWidth = baseMetadata.width;
    const baseHeight = baseMetadata.height;

    for (const item of clothingItems) {
      const position = positions[item.type] || { top: 0, left: 0 };
      
      const adjustedPosition = {
        top: Math.round(position.top * (baseHeight / 800)),
        left: Math.round(position.left * (baseWidth / 600))
      };

      const targetDimensions = {
        width: Math.round(baseWidth * 0.4),
        height: Math.round(baseHeight * 0.3)
      };

      const processedItem = await preprocessClothingItem(
        item.buffer, 
        item.type, 
        targetDimensions
      );

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

// Generate a single outfit suggestion
async function generateSingleSuggestion(imageUrls, occasion, description, req, suggestionNumber, badItemImages = []) {
  try {
    // Handle empty or missing imageUrls
    const safeImageUrls = imageUrls || [];
    const [top, bottom, accessory, footwear] = safeImageUrls;
    const labels = ['Topwear', 'Bottomwear', 'Accessory', 'Footwear'];

    const userBodyShape = req.user?.userBodyInfo?.bodyShape || "";
    const userUnderTone = req.user?.userBodyInfo?.undertone || "";

    const userHeight = req.user?.userBodyInfo?.height &&
      (req.user.userBodyInfo.height.feet > 0 || req.user.userBodyInfo.height.inches > 0)
      ? req.user.userBodyInfo.height
      : { feet: 5, inches: 4 };

    const heightString = `${userHeight.feet}'${userHeight.inches}"`;

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
- Show how the outfit would look on someone with the user's specific body shape
- Use the undertone information for better color coordination in styling
- Ensure the model's height and body proportions match the user's profile for accurate visualization`
    };

    // Identify provided vs missing items
    const providedItems = [];
    const missingItems = [];

    for (let i = 0; i < labels.length; i++) {
      const url = safeImageUrls[i];
      const label = labels[i];
      
      if (url && !badItemImages.includes(url)) {
        try {
          const buffer = await fetchImageBuffer(url);
          providedItems.push({
            type: label,
            buffer: buffer,
            url: url
          });
        } catch (error) {
          console.warn(`Failed to fetch image for ${label}, treating as missing:`, error);
          missingItems.push(label);
        }
      } else {
        missingItems.push(label);
      }
    }

    // Generate base model with missing items and provided items as reference
    const baseModelBuffer = await generateBaseModel(
      missingItems, 
      providedItems, 
      occasion, 
      userProfile, 
      description, 
      suggestionNumber
    );
    
    if (!baseModelBuffer) {
      throw new Error(`Failed to generate base model for suggestion ${suggestionNumber}`);
    }

    // Composite provided items onto the base if any
    let finalImageBuffer;
    if (providedItems.length > 0) {
      finalImageBuffer = await compositeClothingItems(baseModelBuffer, providedItems);
    } else {
      finalImageBuffer = baseModelBuffer;
    }

    // Apply final enhancements
    const enhanced = await sharp(finalImageBuffer)
      .sharpen()
      .normalize()
      .png()
      .toBuffer();

    return {
      type: 'ai_suggestion',
      imageB64: enhanced.toString('base64'),
    };

  } catch (error) {
    console.error(`Error generating suggestion ${suggestionNumber}:`, error);
    throw error;
  }
}

// Main function
export const generateAIFashionSuggestions = async (imageUrls = [], occasion, numberOfImages = 3, description = "", req, badItemImages = []) => {
  try {
    // Handle empty or missing imageUrls parameter
    const safeImageUrls = imageUrls || [];
    const hasProvidedItems = safeImageUrls.some(url => url && url.trim() !== '');
    
    console.log(`Generating ${numberOfImages} fashion suggestions ${hasProvidedItems ? 'with image preservation' : 'from scratch'}...`);
    
    const generatedImages = [];

    // Generate each suggestion
    for (let i = 1; i <= numberOfImages; i++) {
      console.log(`Generating suggestion ${i}/${numberOfImages}...`);
      
      const suggestion = await generateSingleSuggestion(
        safeImageUrls, 
        occasion, 
        description, 
        req, 
        i, 
        badItemImages
      );
      
      generatedImages.push(suggestion);
    }

    return {
      success: true,
      imageB64: generatedImages,
    };

  } catch (error) {
    console.error('Error generating AI fashion suggestions:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};