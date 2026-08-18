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

app.listen(3001, () => {
  console.log('Server running at http://localhost:3001');
});