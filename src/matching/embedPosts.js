require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Pool } = require('pg');
const { getEmbedding } = require('./embed');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const { rows: posts } = await pool.query(
    `SELECT p.id, p.title, p.content FROM posts p
     LEFT JOIN post_embeddings e ON e.post_id = p.id
     WHERE e.post_id IS NULL`
  );

  console.log(`Embedding ${posts.length} posts.\n`);

  for (const post of posts) {
    const text = `${post.title}. ${post.content}`;
    const embedding = await getEmbedding(text);
    await pool.query(
      'INSERT INTO post_embeddings (post_id, embedding) VALUES ($1, $2)',
      [post.id, embedding]
    );
    console.log(`  embedded: ${post.title}`);
  }

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});