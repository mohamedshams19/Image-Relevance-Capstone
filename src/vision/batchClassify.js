const fs = require('fs');
const { VisionResultSchema, CATEGORIES } = require('./schema');

const OLLAMA_URL = 'http://localhost:11434/api/generate';

const PROMPT = `Look at this image and respond with ONLY a JSON object (no markdown, no explanation, no extra text) with exactly these fields:
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
  const imageBase64 = fileToBase64(filepath);

  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llava',
      prompt: PROMPT,
      images: [imageBase64],
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.response;

  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    throw new Error(`Failed to parse Ollama response as JSON: ${text}`);
  }

  const validation = VisionResultSchema.safeParse(parsed);
  if (!validation.success) {
    throw new Error(`Ollama response failed schema validation: ${validation.error.message}`);
  }

  return validation.data;
}

module.exports = { classifyImage };