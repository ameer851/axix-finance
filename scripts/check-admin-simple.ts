import { DatabaseStorage } from '../server/storage.js';

async function checkAdmin() {
  const storage = new DatabaseStorage();
  const user = await storage.getUserByUsername('admin');
  console.log('Admin user:', JSON.stringify(user, null, 2));
}

checkAdmin().catch(console.error);
