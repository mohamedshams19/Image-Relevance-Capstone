require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const { cosineSimilarity } = require('../src/matching/similarity');
const { evaluateMatch } = require('../src/matching/guard');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testGuard(postTitle, imageFilename) {
  const { rows: postRows } = await pool.query(
    `SELECT p.id, p.title, p.content, e.embedding FROM posts p
     JOIN post_embeddings e ON e.post_id = p.id
     WHERE p.title = $1`,
    [postTitle]
  );
  const post = postRows[0];

  const { rows: imageRows } = await pool.query(
    `SELECT i.id, i.filename, i.subject, i.category, i.confidence, e.embedding FROM images i
     JOIN image_embeddings e ON e.image_id = i.id
     WHERE i.filename = $1`,
    [imageFilename]
  );
  const image = imageRows[0];

  const similarity = cosineSimilarity(post.embedding, image.embedding);
  const result = evaluateMatch(post, image, similarity);

  console.log(`Post: "${post.title}"`);
  console.log(`Image: ${image.filename} (${image.subject})`);
  console.log(`Similarity: ${similarity.toFixed(4)}`);
  console.log(`Guard result: ${result.passed ? 'PASSED' : 'REJECTED'}`);
  console.log(`Reason: ${result.reason}`);

  await pool.end();
}

const postTitle = process.argv[2];
const imageFilename = process.argv[3];
testGuard(postTitle, imageFilename).catch(err => {
  console.error(err);
  process.exit(1);
});