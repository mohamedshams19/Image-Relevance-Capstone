# Build Log — AI Usage

Honest record of how AI (Claude) was used building this capstone.

## How this was actually built

I worked through this project with Claude in a conversational, step-by-step way: Claude proposed code for a specific piece (a route, a schema, a script), explained what it did and why, and I ran it myself in my own terminal, on my own machine. Every command in this repo's history was typed and executed by me — installs, `git` commands, `docker` commands, running scripts, testing endpoints with curl. When something broke, I pasted the actual error back, and we worked out the fix together — but I was the one hitting the errors, deciding when something looked wrong, and confirming when something actually worked before moving on.

So the honest split is: Claude drafted code and explained concepts; I built, ran, debugged, and verified the actual system.

## Where AI helped

* Proposing the initial structure for each piece (Express routes, the Zod schemas, the Postgres repository/query patterns) based on the design I sketched in Phase 1.
* Drafting the vision prompt sent to the model and the JSON-parsing logic around it.
* Explaining concepts I hadn't used before — cosine similarity, embeddings, Docker volumes, environment variables, retries — in plain terms as they came up.
* Proposing the mismatch guard's three checks (confidence, similarity threshold, category/subject relevance), which I then tested against real scenarios myself.
* Drafting the automated tests (Vitest).
* Talking through fixes when I hit real errors — a Docker Postgres version mismatch, a missing dependency only exposed by a clean Docker build, a `.env.example` accidentally containing a real API key (I caught this via GitHub's push protection blocking my push, and rotated the key myself), Gemini's free-tier daily quota making the original plan impractical, and a CommonJS/ESM conflict after adding Vitest.

## Where AI was wrong / had to be corrected

* The first vision model name suggested (`gemini-2.0-flash`) was outdated and returned a 404 when I ran it — Google's own error message named the current model, which I used to fix it.
* After adding Vitest, Claude had me convert the guard/schema source files to `export` syntax. This broke every other script in the project that still used `require()` on those files — I hit that error when I ran my standalone test script afterward. We reverted the source files back to `module.exports` instead of converting the whole codebase.
* The original plan (Gemini Flash for vision) hit a hard daily quota (20 requests/day on the free tier) partway through my batch run — I was the one who ran into it live, mid-processing, and had to decide how to handle it.

## What I decided myself

* When the Gemini quota hit and Claude suggested three options (switch to Ollama, trim the dataset, or wait it out), I chose to switch to Ollama rather than lose days waiting on a free-tier reset.
* I picked the specific eval set posts (fox / wolf / gardening) myself, wanting one clear match, one near-miss that would test the guard specifically, and one genuine no-match case.
* I reviewed real output at every stage before moving on — actual curl responses, actual database query results, actual test runs — rather than just trusting that code "should" work.

## Honest limitations

* The vision model (`llava` via Ollama) is noticeably less accurate than a cloud model would have been — one dog photo, for example, was misclassified with category `"person"` instead of `"animal"`. This wasn't corrected in the current build, and is part of why confidence-flagging and the mismatch guard matter.
* The evaluation set has only 3 posts — small enough that the 100% precision figure is a proof-of-concept, not a statistically strong claim.

