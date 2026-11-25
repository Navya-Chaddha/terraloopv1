import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

function parseDataUrl(dataUrl: string): { data: string; mimeType: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return {
    mimeType: "image/jpeg",
    data: dataUrl.replace(/^data:image\/\w+;base64,/, ""),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawImages: string[] = Array.isArray(body.images) && body.images.length > 0
      ? body.images.filter((img: unknown): img is string => typeof img === "string" && img.length > 0)
      : typeof body.image === "string" && body.image.length > 0
      ? [body.image]
      : [];

    if (rawImages.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Add it to .env.local and restart the dev server." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      { model: "gemini-3.5-flash-lite" },
      { apiVersion: "v1" }
    );

    const imageParts = rawImages.map((img) => {
      const { data, mimeType } = parseDataUrl(img);
      return {
        inlineData: {
          data,
          mimeType,
        },
      };
    });

    const prompt = `You are an expert grocer and fruit quality analyst. You are given ${rawImages.length} images (indexed 0 to ${rawImages.length - 1} in order).

Carefully inspect ALL ${rawImages.length} images together:
- If all images show the SAME type of fruit (for example, multiple angles of the same fruit or batch), combine your observations across every angle into ONE entry in "fruits" with "imageIndices": [0, 1, ...] covering all matching images, and set "isMixedFruits": false.
- If the images contain DIFFERENT types of fruits (for example, Image 0 shows an Apple and Image 1 shows a Banana), group images by each distinct fruit type and return a SEPARATE entry in "fruits" for EACH distinct fruit detected, listing its 0-based "imageIndices" and setting "isMixedFruits": true.

For EACH detected fruit entry, provide:
1. "fruitType": detected fruit name (capitalize first letter, e.g. "Apple", "Banana")
2. "imageIndices": array of 0-based image indices (from 0 to ${rawImages.length - 1}) showing this fruit
3. "rating": freshness rating from 1-10 (10 being perfectly fresh)
4. "consumeStatus": "YES" | "NO" | "PROCEED WITH CAUTION"
5. "shelfLife": estimated remaining shelf life (e.g. "2-3 Days", "1 Week")
6. "verdict": brief honest assessment across the visible angles of this fruit
7. "alternativeUses": array of 3 alternative uses if overripe
8. "recommendedUses": array of 3-5 uses based on the freshness rating:
   - Rating 8-10 (Excellent): ["Fresh Eating", "Premium Gift Baskets", "Restaurant Grade", "Smoothies", "Fruit Salads"]
   - Rating 6-7 (Good): ["Fresh Juice", "Smoothies", "Cooking", "Baking", "Jam Making"]
   - Rating 4-5 (Fair): ["Cooking Only", "Baking", "Face Mask", "Hair Treatment", "Vinegar Making"]
   - Rating 1-3 (Poor): ["Composting", "Plant Fertilizer", "Animal Feed Only"]
9. "qualityGrade": "Excellent" | "Good" | "Fair" | "Poor"
10. "priceEstimate": estimated price in INR per kg based on fruit type and quality

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "isMixedFruits": <boolean>,
  "summary": "<one concise sentence summarizing what was detected across all images>",
  "fruits": [
    {
      "fruitType": "<string>",
      "imageIndices": [<number>],
      "rating": <number 1-10>,
      "consumeStatus": "<YES | NO | PROCEED WITH CAUTION>",
      "shelfLife": "<string>",
      "verdict": "<string>",
      "alternativeUses": ["<use 1>", "<use 2>", "<use 3>"],
      "recommendedUses": ["<use 1>", "<use 2>", "<use 3>"],
      "qualityGrade": "<Excellent | Good | Fair | Poor>",
      "priceEstimate": <number>
    }
  ]
}`;

    // Pass each image with an explicit index label so Gemini maps imageIndices accurately
    const contentParts: Array<string | { inlineData: { data: string; mimeType: string } }> = [prompt];
    imageParts.forEach((part, idx) => {
      contentParts.push(`Image ${idx}:`);
      contentParts.push(part);
    });

    const result = await model.generateContent(contentParts);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ analysis: text });
  } catch (error) {
    console.error("Error analyzing images:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze images" },
      { status: 500 }
    );
  }
}
