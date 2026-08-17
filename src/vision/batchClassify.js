require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { classifyImage } = require('./classifyImage');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const IMAGES_DIR = path.join(__dirname, '..', '..', 'images');
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;
const DELAY_BETWEEN_IMAGES_MS = 0;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function logApiCall(callType, target, success) {
  await pool.query(
    'INSERT INTO api_calls (call_type, target, cost_estimate, success) VALUES ($1, $2, $3, $4)',
    [callType, target, 0.0, success]
  );
}

async function classifyWithRetry(filepath, filename) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await classifyImage(filepath);
      await logApiCall('vision', filename, true);
      return result;
    } catch (err) {
      lastError = err;
      console.log(`  attempt ${attempt} failed for ${filename}: ${err.message}`);
      await logApiCall('vision', filename, false);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  throw lastError;
}

async function saveImageResult(filename, result) {
  await pool.query(
    `INSERT INTO images (filename, subject, category, attributes, caption, confidence)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [filename, result.subject, result.category, result.attributes, result.caption, result.confidence]
  );
}

async function getAlreadyProcessed() {
  const { rows } = await pool.query('SELECT filename FROM images');
  return new Set(rows.map(r => r.filename));
}

async function main() {
  const allFiles = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.jpg'));
  const alreadyProcessed = await getAlreadyProcessed();
  const files = allFiles.filter(f => !alreadyProcessed.has(f));

  console.log(`Found ${allFiles.length} total images, ${alreadyProcessed.size} already processed, ${files.length} remaining.\n`);

  let succeeded = 0;
  let failed = 0;
  let flagged = 0;

  const CONFIDENCE_THRESHOLD = 0.6;

  for (const filename of files) {
    const filepath = path.join(IMAGES_DIR, filename);
    console.log(`Processing ${filename}...`);

    try {
      const result = await classifyWithRetry(filepath, filename);
      await saveImageResult(filename, result);

      if (result.confidence < CONFIDENCE_THRESHOLD) {
        console.log(`  FLAGGED: low confidence (${result.confidence})`);
        flagged++;
      } else {
        console.log(`  OK: ${result.subject} (${result.category}, confidence ${result.confidence})`);
      }
      succeeded++;
    } catch (err) {
      console.log(`  FAILED after ${MAX_RETRIES} attempts: ${err.message}`);
      failed++;
    }

    await sleep(DELAY_BETWEEN_IMAGES_MS);
  }

  console.log(`\nDone.`);
  console.log(`succeeded=${succeeded}`);
  console.log(`failed=${failed}`);
  console.log(`flagged_low_confidence=${flagged}`);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});