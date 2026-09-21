const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const user = await db.collection('User').findOne({ username: 'admin' });
  if (user) {
    const stats = await db.collection('Stats').findOne({ userId: user._id.toString() });
    console.log('Stats for admin:', stats);
  } else {
    console.log('No admin user');
  }
  process.exit(0);
}
run();

