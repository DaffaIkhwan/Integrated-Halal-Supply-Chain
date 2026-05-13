require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
});

async function run() {
  try {
    await client.connect();
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('Extension pgvector enabled successfully!');
  } catch (err) {
    console.error('Error enabling extension:', err);
  } finally {
    await client.end();
  }
}

run();
