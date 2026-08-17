const OLLAMA_URL = 'http://localhost:11434/api/embeddings';

async function getEmbedding(text) {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'all-minilm',
      prompt: text
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.embedding;
}

module.exports = { getEmbedding };