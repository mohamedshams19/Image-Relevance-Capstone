# AI Image Understanding & Content Matching Engine

A system that understands an image library using AI vision, matches the right image to the right blog post based on meaning (not filenames or keywords), and refuses to guess when no image is a confident match.

## The problem

Given a library of images and a set of blog posts, automatically suggest the best-matching image for each post — while never suggesting a wrong match with false confidence. A post about red foxes should get a red fox photo; a similar-looking wolf photo must be rejected, with a clear reason why.

## Design

### Image metadata schema

Every image is processed by a vision model (Gemini Flash) and produces structured, schema-validated metadata:

```json
{
  "subject": "red fox",
  "category": "animal",
  "attributes": ["orange fur", "wild", "forest"],
  "caption": "A red fox standing in a forest",
  "confidence": 0.94
}
```

- `subject` — the specific thing in the image (string)
- `category` — a coarse grouping from a small fixed set (string), used for fast guard checks
- `attributes` — descriptive tags (array of strings)
- `caption` — a natural-language description, used to generate the embedding for matching
- `confidence` — the vision model's own 0–1 estimate; low-confidence results are flagged for review rather than trusted silently

Responses are validated against this schema with Zod. Invalid responses are never accepted — they are retried or flagged.

### Database design

- **images** — id, filename, url, subject, category, attributes (array), caption, confidence, created_at
- **posts** — id, title, content, created_at
- **image_embeddings** — image_id, embedding (vector)
- **post_embeddings** — post_id, embedding (vector)
- **suggestions** — id, post_id, image_id, similarity_score, guard_passed (bool), guard_reason, status (pending / approved / rejected)

### Matching strategy

1. Generate an embedding for each image's `caption` and each post's text/title, using Gemini's embedding model.
2. For a given post, compute cosine similarity between the post's embedding and every image's embedding, and rank candidates descending by similarity.

### The mismatch guard

Before any suggestion reaches a human, the top candidate must pass three checks:

1. **Category/subject relevance** — does the image's `category`/`subject` plausibly relate to the post's topic?
2. **Similarity threshold** — is the cosine similarity score above a tuned cutoff? (Tuned using a labeled evaluation set, not guessed.)
3. **Confidence** — was the image's own vision-tagging confidence high enough to trust in the first place?

If any check fails, the suggestion is rejected with a specific, human-readable reason (e.g. `"Animal category mismatch: expected fox, detected wolf"`). If no image clears the bar at all, the system responds with "no confident match" and its reasons — rather than returning the best of a bad set.

## Non-goal

This project does not build a general-purpose image search engine or a full frontend UI. The review interface is API endpoints plus a simple table, not a polished admin panel.

## Dataset

~50 images across a few animal categories (fox, wolf, dog, bear, deer), sourced from Unsplash/Pexels under their free licenses, gathered via a small download script (`scripts/download-images.js`) so the corpus is reproducible without committing binary image files to the repo.

## Stack

- Node.js + Express
- PostgreSQL (via Docker)
- Gemini Flash — vision understanding + embeddings (free tier)
- Zod — schema validation

## Status

Phase 1 (design) in progress.
