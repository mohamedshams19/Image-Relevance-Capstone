require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const { cosineSimilarity } = require('../src/matching/similarity');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function rankImagesForPost(postTitle) {
  const { rows: postRows } = await pool.query(
    `SELECT p.id, p.title, e.embedding FROM posts p
     JOIN post_embeddings e ON e.post_id = p.id
     WHERE p.title = $1`,
    [postTitle]
  );

  if (postRows.length === 0) {
    throw new Error(`Post not found: ${postTitle}`);
  }
  const post = postRows[0];

  const { rows: images } = await pool.query(
    `SELECT i.id, i.filename, i.subject, i.category, e.embedding FROM images i
     JOIN image_embeddings e ON e.image_id = i.id`
  );

  const ranked = images
    .map(img => ({
      filename: img.filename,
      subject: img.subject,
      category: img.category,
      similarity: cosineSimilarity(post.embedding, img.embedding)
    }))
    .sort((a, b) => b.similarity - a.similarity);

  console.log(`\nTop 10 matches for "${post.title}":\n`);
  ranked.slice(0, 10).forEach((r, i) => {
    console.log(`${i + 1}. ${r.filename} — ${r.subject} (similarity: ${r.similarity.toFixed(4)})`);
  });

  await pool.end();
}

const postTitle = process.argv[2] || 'The Behavior of Red Foxes';
rankImagesForPost(postTitle).catch(err => {
  console.error(err);
  process.exit(1);
});