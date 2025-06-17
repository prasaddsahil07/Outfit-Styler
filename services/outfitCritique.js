import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getOutfitCritique(imageUrls, occasion) {
    const [top, bottom, accessory, footwear] = imageUrls;
    const labels = ['Topwear', 'Bottomwear', 'Accessory', 'Footwear'];

    const userContent = [
        {
            type: "input_text",
            text: `You are a professional fashion stylist. The user has uploaded 1 to 4 clothing items labeled as: Topwear, Bottomwear, Footwear, and Accessory. The occasion is: ${occasion}.

Your tasks:

1. Give a short fashion critique (within 50 words) about how well the items work together for the given occasion.
2. Conclude with either:
   ✅ Perfect Match
   ❌ Not Suitable
3. If ❌ Not Suitable, specify exactly which items are not suitable using this **exact JSON format**, including only the items provided:

{
  "Topwear": "suitable" | "not suitable",
  "Bottomwear": "suitable" | "not suitable",
  "Footwear": "suitable" | "not suitable",
  "Accessory": "suitable" | "not suitable"
}

⚠️ Rules:
- Only include keys for items that are provided.
- The critique must come **before** the JSON.
- Do not include any extra commentary outside the JSON.
- The JSON must be valid and appear exactly as shown.

Respond strictly in this structure.
`
        },
        ...(top ? [{ type: "input_image", image_url: top }] : []),
        ...(bottom ? [{ type: "input_image", image_url: bottom }] : []),
        ...(accessory ? [{ type: "input_image", image_url: accessory }] : []),
        ...(footwear ? [{ type: "input_image", image_url: footwear }] : []),
    ];

    const messages = [{ role: "user", content: userContent }];

    const response = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: messages
    });

    const critique = response.output_text;
    const isPerfectMatch = critique.includes("✅ Perfect Match");

    const mismatchRegex = /Mismatched:\s*\[([^\]]+)\]/i;
    const match = critique.match(mismatchRegex);

    let badItemIndices = [];

    if (!isPerfectMatch && match) {
        const mismatchedLabels = match[1].split(",").map(label => label.trim());
                
        // Get indices of mismatched items based on their labels
        badItemIndices = labels
            .filter((label, index) => mismatchedLabels.includes(label) && imageUrls[index])
            .map(label => labels.indexOf(label));
    }

    return {
        critique,
        isPerfectMatch,
        badItemIndices
    };
}



















































// import OpenAI from "openai";

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// export async function getOutfitCritique(imageUrls, occasion) {
//     const labels = ["Topwear", "Bottomwear", "Accessory", "Footwear"];

//     const userContent = [
//         {
//             type: "input_text",
//             text: `You are a fashion stylist. The user has uploaded 1 to 4 clothing items with labels (Topwear, Bottomwear, Accessory, Footwear). 
// Each image is labeled. The occasion is: ${occasion}.
// Your job is:
// 1. Give a short critique (max 50 words).
// 2. Conclude with '✅ Perfect Match' or '❌ Not Suitable'.
// 3. If Not Suitable, specify the labels of mismatched items in this exact format:
// Mismatched: [Topwear, Accessory] or Mismatched: [Bottomwear, Footwear] etc.`
//         },
//         ...imageUrls.map((url, index) => ({
//             type: "image_url",
//             image_url: url,
//             detail: "auto",
//             name: labels[index] // This label helps the model know which part it is
//         })),
//     ];

//     const messages = [{ role: "user", content: userContent }];

//     const completion = await openai.chat.completions.create({
//         model: "gpt-4-vision-preview", // or another model that supports images
//         messages,
//         max_tokens: 500
//     });

//     const critique = completion.choices[0].message.content;
//     const isPerfectMatch = critique.includes("✅ Perfect Match");

//     // Extract mismatched labels if present
//     const mismatchRegex = /Mismatched:\s*\[([^\]]+)\]/i;
//     const match = critique.match(mismatchRegex);

//     let badItemIndices = [];

//     if (!isPerfectMatch && match) {
//         const mismatchedLabels = match[1].split(",").map(label => label.trim());
//         badItemIndices = labels
//             .map((label, index) => mismatchedLabels.includes(label) ? index : -1)
//             .filter(index => index !== -1);
//     }

//     return {
//         critique,
//         isPerfectMatch,
//         badItemIndices
//     };
// }
