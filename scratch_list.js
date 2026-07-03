const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
let mongoUri = "mongodb://127.0.0.1:27017/reserveze";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^MONGODB_URI=(.+)$/m);
  if (match && match[1]) {
    mongoUri = match[1].trim();
  }
}

async function main() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB:", mongoUri);
    
    const db = mongoose.connection.db;
    const businesses = await db.collection('businesses').find({}).toArray();
    console.log("Businesses in Database:");
    console.log(JSON.stringify(businesses, null, 2));

    const users = await db.collection('users').find({}).toArray();
    console.log("Users in Database:");
    console.log(JSON.stringify(users.map(u => ({ _id: u._id, email: u.email })), null, 2));
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
