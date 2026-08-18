require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const { suggestImageForPost } = require('../src/matching/suggestImage');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Ground truth: for each post, the category of image that counts as "correct"
const EVAL_SET = [
  { postTitle: 'The Behavior of Red Foxes', correctSubjectPatterns: ['fox'] },
  { postTitle: 'Understanding Wolf Pack Dynamics', correctSubjectPatterns: ['wolf', 'wolves'] },
  { postTitle: 'A Guide to Home Gardening', correctSubjectPatterns: null } // expect no match
];

async function main() {
  let correct = 0;
  let total = EVAL_SET.length;
  const results = [];

  for (const testCase of EVAL_SET) {
    const { rows } = await pool.query('SELECT id FROM posts WHERE title = $1', [testCase.postTitle]);
    if (rows.length === 0) {
      console.log(`SKIP: post not found — ${testCase.postTitle}`);
      continue;
    }
    const postId = rows[0].id;

    const suggestion = await suggestImageForPost(postId);

      let isCorrect;
    if (testCase.correctSubjectPatterns === null) {
      isCorrect = suggestion.suggested_image === null;
    } else {
      const gotSubject = suggestion.suggested_image ? suggestion.suggested_image.subject.toLowerCase() : '';
      isCorrect = testCase.correctSubjectPatterns.some(pattern => gotSubject.includes(pattern));
    }

    if (isCorrect) correct++;

    results.push({
      post: testCase.postTitle,
      expected: testCase.correctSubjectPatterns ? testCase.correctSubjectPatterns.join('/') : 'no match',
      got: suggestion.suggested_image ? suggestion.suggested_image.subject : 'no match',
      correct: isCorrect
    });
}
  console.log('\nEval results:\n');
  results.forEach(r => {
    console.log(`${r.correct ? 'PASS' : 'FAIL'} — "${r.post}" — expected: ${r.expected}, got: ${r.got}`);
  });

  const precision = (correct / total) * 100;
  console.log(`\nTop-1 precision: ${precision.toFixed(1)}% (${correct}/${total})`);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});