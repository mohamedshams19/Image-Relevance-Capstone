require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const { classifyImage } = require('../src/vision/classifyImage');

async function main() {
  const testImage = path.join(__dirname, '..', 'images', 'red-fox-1.jpg');
  const result = await classifyImage(testImage);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});