require('dotenv').config();
const express = require('express');
const { suggestImageForPost } = require('./matching/suggestImage');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ name: 'AI Image Matching Engine', version: '1.0' });
});

app.get('/posts/:id/images', async (req, res) => {
  const postId = parseInt(req.params.id);
  const result = await suggestImageForPost(postId);

  if (result.error) {
    return res.status(404).json(result);
  }

  res.json(result);
});
app.get('/suggestions', async (req, res) => {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { rows } = await pool.query(
    `SELECT s.id, p.title AS post_title, i.filename AS image_filename,
            s.similarity_score, s.guard_passed, s.guard_reason, s.status
     FROM suggestions s
     JOIN posts p ON p.id = s.post_id
     LEFT JOIN images i ON i.id = s.image_id
     ORDER BY s.created_at DESC`
  );
  res.json(rows);
});

app.post('/suggestions/:id/approve', async (req, res) => {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const id = parseInt(req.params.id);

  const { rows } = await pool.query(
    `UPDATE suggestions SET status = 'approved' WHERE id = $1 RETURNING *`,
    [id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: `Suggestion ${id} not found` });
  }
  res.json(rows[0]);
});

app.post('/suggestions/:id/reject', async (req, res) => {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const id = parseInt(req.params.id);

  const { rows } = await pool.query(
    `UPDATE suggestions SET status = 'rejected' WHERE id = $1 RETURNING *`,
    [id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: `Suggestion ${id} not found` });
  }
  res.json(rows[0]);
});
app.listen(3001, () => {
  console.log('Server running at http://localhost:3001');
});