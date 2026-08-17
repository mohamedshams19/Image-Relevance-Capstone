require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { Pool } = require('pg');
const { getEmbedding } = require('./embed');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const { rows: images } = await pool.query(
    `SELECT i.id, i.caption FROM images i
     LEFT JOIN image_embeddings e ON e.image_id = i.id
     WHERE e.image_id IS NULL`
  );

  console.log(`Embedding ${images.length} images without existing embeddings.\n`);

  let succeeded = 0;
  let failed = 0;

  for (const image of images) {
    try {
      const embedding = await getEmbedding(image.caption);
      await pool.query(
        'INSERT INTO image_embeddings (image_id, embedding) VALUES ($1, $2)',
        [image.id, embedding]
      );
      console.log(`  embedded image ${image.id}: "${image.caption}"`);
      succeeded++;
    } catch (err) {
      console.log(`  FAILED image ${image.id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. succeeded=${succeeded} failed=${failed}`);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});