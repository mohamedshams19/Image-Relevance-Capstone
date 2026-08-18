# Evidence

One pasted proof per Definition-of-Done checkbox (§6 of the capstone brief).

## AI Processing

**Vision model produces structured output validated against a schema; invalid responses are never trusted.**

```
"subject": "red fox",
"category": "animal",
"attributes": ["wildlife", "orange fur", "snow", "standing"],
"caption": "A red fox stands on a snowy ridge bathed in warm sunlight.",
"confidence": 0.98
```
Every response is checked with `VisionResultSchema.safeParse()` (Zod) before being stored. See `src/vision/schema.test.js` for automated proof malformed responses (invalid category, out-of-range confidence, missing fields) are rejected.

**Low-confidence classifications are flagged instead of accepted.**

`src/vision/batchClassify.js` checks every result against `CONFIDENCE_THRESHOLD = 0.6` and logs `FLAGGED: low confidence` for anything below it, rather than silently accepting it.

**Images are processed through a batch background job with retries.**

`src/vision/batchClassify.js` — `classifyWithRetry()` retries each image up to `MAX_RETRIES = 3` times on failure. Final batch run:
```
Found 50 total images, 21 already processed, 29 remaining.
...
Done.
succeeded=29
failed=0
flagged_low_confidence=0
```
Combined with the earlier run, all 50 images were successfully processed and stored.

**Vision and embedding costs are tracked per call.**

Every vision call is logged to the `api_calls` table via `logApiCall()` in `src/vision/batchClassify.js`, recording call type, target, cost estimate, and success/failure. Note: the vision pipeline runs on a local Ollama model (see Limitations below), so real per-call dollar cost is $0 — the tracking mechanism itself is functional and would attribute real costs if a paid API were used.

## Matching System

**Image and post embeddings are stored; posts return ranked image suggestions.**

`src/matching/embedImages.js` and `src/matching/embedPosts.js` generate and store embeddings for all 50 images and all 3 test posts in `image_embeddings` / `post_embeddings`.

**Semantic matching works for equivalent concepts.**

```
fox vs fox (different wording): 0.47314568990576245
fox vs car: 0.3282115714664218
```
"A red fox standing in a forest" vs. "Vulpes vulpes, a wild fox species" scored meaningfully higher than an unrelated concept, despite sharing almost no words.

Real ranking output for the fox post — all top 10 results are fox images:
```
1. red-fox-5.jpg — foxes (similarity: 0.6458)
2. red-fox-8.jpg — fox (similarity: 0.6182)
3. red-fox-6.jpg — fox (similarity: 0.6153)
...
10. red-fox-7.jpg — fox (similarity: 0.5213)
```

## Safety Layer

**The mismatch guard rejects incorrect recommendations — the wolf-on-a-fox-post scenario provably fails.**

```
$ node scripts/test-guard.js "The Behavior of Red Foxes" wolf-8.jpg
Post: "The Behavior of Red Foxes"
Image: wolf-8.jpg (wolves)
Similarity: 0.4523
Guard result: REJECTED
Reason: Subject mismatch: post does not mention "wolves" or related terms
```
Notably, similarity (0.4523) was above the numeric threshold (0.4) — the category/subject check caught a mismatch that pure similarity would have missed.

**Rejections include a human-readable explanation.**

See the `Reason:` line above, and `src/matching/guard.js` (`evaluateMatch`), which always returns a specific reason string for both passes and rejections.

**When no image clears the bar, the system answers "no confident match" with reasons.**

```
$ curl http://localhost:3001/posts/3/images
{"post_id":3,"post_title":"A Guide to Home Gardening","suggested_image":null,"message":"No confident match found. All candidate images failed the mismatch guard (similarity, confidence, or subject relevance)."}
```

## Backend

**Database models for images, tags, embeddings, posts, suggestions, approvals/rejections — with the required indexes.**

See `init.sql` — tables: `images`, `posts`, `image_embeddings`, `post_embeddings`, `suggestions`, `api_calls`. Primary keys on all tables; foreign keys with `ON DELETE CASCADE`/`SET NULL` between `suggestions` and `images`/`posts`.

**API endpoints validated; the review workflow (approve / reject / inspect why) exists.**

`src/server.js`:
- `GET /posts/:id/images` — returns a suggestion or "no confident match"
- `GET /suggestions` — lists all suggestion attempts with guard reasoning
- `POST /suggestions/:id/approve` and `POST /suggestions/:id/reject` — tested manually, confirmed status field updates correctly from `pending` to `approved`/`rejected`.

## Quality & Documentation

**Automated tests cover schema validation, mismatch rejection, and matching accuracy.**

```
✓ src/matching/guard.test.js (4 tests) 3ms
✓ src/vision/schema.test.js (4 tests) 4ms
Test Files  2 passed (2)
     Tests  8 passed (8)
```

**A small labeled evaluation dataset measures top-1 precision — the number is in your README.**

```
Eval results:
PASS — "The Behavior of Red Foxes" — expected: fox, got: foxes
PASS — "Understanding Wolf Pack Dynamics" — expected: wolf/wolves, got: wolves
PASS — "A Guide to Home Gardening" — expected: no match, got: no match
Top-1 precision: 100.0% (3/3)
```
Honest caveat: this eval set has 3 posts, on the small end of "small labeled evaluation dataset." See Limitations in the README.

**README with architecture explanation and diagram; submission-pack files present.**

See `README.md`, `capstone.yaml`, `BUILDLOG.md`, this file, and `.env.example`.
