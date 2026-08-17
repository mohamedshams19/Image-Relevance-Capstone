require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const IMAGES_DIR = path.join(__dirname, '..', 'images');
const PER_CATEGORY = 10;

const categories = ['red fox', 'wolf', 'dog', 'bear', 'deer'];

async function downloadCategory(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${PER_CATEGORY}&client_id=${ACCESS_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unsplash search failed for "${query}": ${response.status}`);
  }

  const data = await response.json();
  const results = data.results;

  console.log(`${query}: found ${results.length} images`);

  const manifest = [];

  for (let i = 0; i < results.length; i++) {
    const photo = results[i];
    const imageUrl = photo.urls.regular;
    const filename = `${query.replace(/\s+/g, '-')}-${i + 1}.jpg`;
    const filepath = path.join(IMAGES_DIR, filename);

    const imgResponse = await fetch(imageUrl);
    const buffer = Buffer.from(await imgResponse.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    manifest.push({
      filename,
      category_hint: query,
      unsplash_id: photo.id,
      author: photo.user.name,
      unsplash_url: photo.links.html
    });

    console.log(`  saved ${filename}`);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return manifest;
}

async function main() {
  if (!ACCESS_KEY) {
    throw new Error('UNSPLASH_ACCESS_KEY is missing from .env');
  }

  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  let fullManifest = [];
  for (const category of categories) {
    const manifest = await downloadCategory(category);
    fullManifest = fullManifest.concat(manifest);
  }

  fs.writeFileSync(
    path.join(IMAGES_DIR, 'manifest.json'),
    JSON.stringify(fullManifest, null, 2)
  );

  console.log(`\nDone. ${fullManifest.length} images downloaded.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});