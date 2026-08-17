const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { VisionResultSchema, CATEGORIES } = require('./schema');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PROMPT = `Look at this image and respond with ONLY a JSON object (no markdown, no explanation) with exactly these fields:
{
  "subject": "the main thing in the image, a short noun phrase",
  "category": "one of: ${CATEGORIES.join(', ')}",
  "attributes": ["3-5 short descriptive tags"],
  "caption": "one sentence describing the image",
  "confidence": 0.0 to 1.0, how confident you are in this classification
}`;

function fileToBase64(filepath) {
  return fs.readFileSync(filepath).toString('base64');
}

async function classifyImage(filepath) {
 const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

  const imageBase64 = fileToBase64(filepath);

  const result = await model.generateContent([
    PROMPT,
    {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg'
      }
    }
  ]);

  const text = result.response.text();

  let parsed;
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse Gemini response as JSON: ${text}`);
  }

  const validation = VisionResultSchema.safeParse(parsed);
  if (!validation.success) {
    throw new Error(`Gemini response failed schema validation: ${validation.error.message}`);
  }

  return validation.data;
}

module.exports = { classifyImage };