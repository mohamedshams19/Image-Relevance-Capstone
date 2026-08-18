const { Pool } = require('pg');
const { cosineSimilarity } = require('./similarity');
const { evaluateMatch } = require('./guard');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function suggestImageForPost(postId) {
  const { rows: postRows } = await pool.query(
    `SELECT p.id, p.title, p.content, e.embedding FROM posts p
     JOIN post_embeddings e ON e.post_id = p.id
     WHERE p.id = $1`,
    [postId]
  );

  if (postRows.length === 0) {
    return { error: 'Post not found or not yet embedded' };
  }
  const post = postRows[0];

  const { rows: images } = await pool.query(
    `SELECT i.id, i.filename, i.subject, i.category, i.confidence, e.embedding FROM images i
     JOIN image_embeddings e ON e.image_id = i.id`
  );

  const ranked = images
    .map(img => ({
      ...img,
      similarity: cosineSimilarity(post.embedding, img.embedding)
    }))
    .sort((a, b) => b.similarity - a.similarity);

  for (const candidate of ranked) {
    const result = evaluateMatch(post, candidate, candidate.similarity);

    await pool.query(
      `INSERT INTO suggestions (post_id, image_id, similarity_score, guard_passed, guard_reason, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [post.id, candidate.id, candidate.similarity, result.passed, result.reason, result.passed ? 'pending' : 'rejected']
    );

    if (result.passed) {
      return {
        post_id: post.id,
        post_title: post.title,
        suggested_image: {
          id: candidate.id,
          filename: candidate.filename,
          subject: candidate.subject,
          similarity: candidate.similarity
        },
        guard_reason: result.reason
      };
    }
  }

  await pool.query(
    `INSERT INTO suggestions (post_id, image_id, similarity_score, guard_passed, guard_reason, status)
     VALUES ($1, NULL, NULL, false, $2, 'no_match')`,
    [post.id, 'No image cleared the guard: all candidates failed similarity, confidence, or subject relevance checks']
  );

  return {
    post_id: post.id,
    post_title: post.title,
    suggested_image: null,
    message: 'No confident match found. All candidate images failed the mismatch guard (similarity, confidence, or subject relevance).'
  };
}

module.exports = { suggestImageForPost };