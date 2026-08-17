const { getEmbedding } = require('../src/matching/embed');
const { cosineSimilarity } = require('../src/matching/similarity');

async function main() {
  const fox1 = await getEmbedding('A red fox standing in a forest');
  const fox2 = await getEmbedding('Vulpes vulpes, a wild fox species');
  const car = await getEmbedding('A red sports car on the highway');

  console.log('fox vs fox (different wording):', cosineSimilarity(fox1, fox2));
  console.log('fox vs car:', cosineSimilarity(fox1, car));
}

main();