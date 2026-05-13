const { Client } = require('pg');
const client = new Client({ user: 'myadmin', password: 'myrahasia', host: 'localhost', port: 5433, database: 'nextrag_db' });
client.connect().then(() => client.query("SELECT chunk FROM oai WHERE chunk ILIKE '%penyembelihan%' LIMIT 3")).then(res => { console.log('Result length:', res.rows.length); client.end(); }).catch(console.error);
