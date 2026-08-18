# AI Image Understanding & Content Matching Engine

Understands an image library using AI vision, matches the right image to the right blog post based on meaning (not filenames or keywords), and refuses to guess when no image is a confident match — a red-fox post gets the red-fox photo, never the wolf.

## Architecture

```
Images ──(batch job)──► Vision Model (Ollama/llava) ──► {subject, category, attributes, caption, confidence}
                                                              │
                                                              ├──► stored in images table
                                                              └──► embed(caption) ──► image_embeddings

Posts ─────────────────────────────────────────────────────► embed(title + content) ──► post_embeddings

GET /posts/:id/images
   └──► rank all images by cosine similarity to the post's embedding
   └──► for each candidate, top to bottom:
          Mismatch Guard checks: confidence ≥ 0.6, similarity ≥ 0.4, subject relevance
          ├──► first candidate to pass → suggested image (with reason)
          └──► none pass → "no confident match" (with reason)
   └──► every attempt logged to suggestions table
   └──► Review API: GET /suggestions · POST /suggestions/:id/approve · POST /suggestions/:id/reject
```

## How to run it

1. Clone this repo:
   ```
   git clone https://github.com/mohamedshams19/Image-Relevance-Capstone.git
   cd Image-Relevance-Capstone
   ```
2. Copy the environment template and fill in real values:
   ```
   copy .env.example .env
   ```
   You'll need a free Unsplash API key (for the image download script). No Gemini key is required for the current build — vision runs locally via Ollama.
3. Install [Ollama](https://ollama.com/download), then pull the two local models used:
   ```
   ollama pull llava
   ollama pull all-minilm
   ```
4. Start the database:
   ```
   docker compose up -d
   ```
5. Seed the data (downloads ~50 images, tags them, generates embeddings, creates test posts):
   ```
   node scripts/download-images.js
   node src/vision/batchClassify.js
   node src/matching/embedImages.js
   node scripts/seed-posts.js
   node src/matching/embedPosts.js
   ```
6. Start the API:
   ```
   node src/server.js
   ```
   Now running at `http://localhost:3001`.
7. Run the tests:
   ```
   npm test
   ```
8. Run the evaluation:
   ```
   node scripts/eval.js
   ```

## Try it

```
curl http://localhost:3001/posts/1/images
```
Returns a suggested image with the guard's reasoning for the fox post.

```
curl http://localhost:3001/posts/3/images
```
Returns `"suggested_image": null` for the gardening post — no relevant image exists, and the system says so rather than guessing.

## Evaluation

Top-1 precision on the labeled evaluation set: **100% (3/3)**. See `scripts/eval.js` and `EVIDENCE.md` for the full run output.

Honestly: this eval set has only 3 posts, which is small even by the brief's own "small labeled evaluation dataset" standard. The 100% figure demonstrates the system working correctly on its test cases, not a statistically strong accuracy claim — treat it as a proof of concept.

## The mismatch guard

Every candidate image must pass three checks before being suggested:

1. **Vision confidence** — was the model itself confident about this image's classification? (≥ 0.6)
2. **Similarity threshold** — is the semantic similarity between the post and the image's caption high enough? (≥ 0.4)
3. **Subject relevance** — does the post's own text actually reference this image's subject?

A real example that shows why all three matter: forcing a wolf image onto the fox post scored 0.4523 similarity — *above* the numeric threshold, meaning similarity alone would have wrongly allowed it. The subject-relevance check caught what the similarity score missed and correctly rejected it:

```
Guard result: REJECTED
Reason: Subject mismatch: post does not mention "wolves" or related terms
```

## Stack

- Node.js + Express
- PostgreSQL, via Docker
- Ollama (local): `llava` for vision, `all-minilm` for embeddings
- Zod for schema validation
- Vitest for automated tests

## Limitations

- **Vision accuracy**: running locally via Ollama's `llava` model trades accuracy for zero cost and no rate limits. It is noticeably less reliable than a cloud model — one dog photo, for example, was classified with category `"person"` instead of `"animal"`. This is a genuine limitation of the current build, not silently hidden: it's exactly why confidence-flagging and the mismatch guard exist as a second line of defense against a single unreliable classification.
- **Why Ollama instead of Gemini**: the original plan used Gemini Flash's free tier, but its daily quota (20 requests/day) made iterating on a 50-image dataset impractical during development. Ollama was the supported local alternative named in the capstone brief, not a deviation from it.
- **Small eval set**: 3 labeled posts is minimal. A stronger precision claim would need a larger, more varied set (more posts, more edge cases, more categories tested against each other).
- **No frontend**: as scoped by the brief, the review interface is API endpoints only (`GET /suggestions`, approve/reject), not a UI.

## Required files

- `capstone.yaml` — run/seed/test commands for evaluators
- `EVIDENCE.md` — pasted proof for every Definition-of-Done checkbox
- `BUILDLOG.md` — honest AI-usage log
- `.env.example` — every environment variable, placeholder values only
