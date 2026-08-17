require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const posts = [
  {
    title: 'The Behavior of Red Foxes',
    content: 'Red foxes are highly adaptable animals found across forests, grasslands, and even urban areas. Known for their reddish-orange fur and bushy tails, foxes are solitary hunters that primarily hunt at night, using their keen sense of smell and hearing to track down small mammals.'
  },
  {
    title: 'Understanding Wolf Pack Dynamics',
    content: 'Gray wolves live and hunt in structured packs, typically led by a breeding pair. Pack hierarchy determines hunting roles, territory defense, and pup-rearing responsibilities. Wolves communicate through howls, body language, and scent marking.'
  },
  {
    title: 'A Guide to Home Gardening',
    content: 'Starting a home garden requires understanding your soil type, local climate, and sunlight exposure. Raised beds are a popular choice for beginners, offering better drainage and easier weed control than traditional in-ground plots.'
  }
];

async function main() {
  for (const post of posts) {
    await pool.query(
      'INSERT INTO posts (title, content) VALUES ($1, $2)',
      [post.title, post.content]
    );
    console.log(`Inserted: ${post.title}`);
  }
  await pool.end();
}

main();