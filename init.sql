CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT,
  subject TEXT,
  category TEXT,
  attributes TEXT[],
  caption TEXT,
  confidence REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS image_embeddings (
  image_id INTEGER PRIMARY KEY REFERENCES images(id) ON DELETE CASCADE,
  embedding REAL[] NOT NULL
);

CREATE TABLE IF NOT EXISTS post_embeddings (
  post_id INTEGER PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  embedding REAL[] NOT NULL
);

CREATE TABLE IF NOT EXISTS suggestions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_id INTEGER REFERENCES images(id) ON DELETE SET NULL,
  similarity_score REAL,
  guard_passed BOOLEAN NOT NULL,
  guard_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_calls (
  id SERIAL PRIMARY KEY,
  call_type TEXT NOT NULL,
  target TEXT,
  cost_estimate REAL,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);