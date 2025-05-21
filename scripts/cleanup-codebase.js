import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Files to remove from scripts directory
const scriptsToRemove = [
  'list-tables.js',
  'check-api.js',
  'test-db-connection.js',
  'test-db-connection-detailed.js',
  'test-email.js',
  'test-email.cjs',
  'email-test.js',
  'email-test-simple.js',
  'test-brevo.js',
  'test-websocket.js',
  'cleanup-codebase.js' // Remove itself at the end
];

// Remove unnecessary scripts
console.log('Removing unnecessary script files...');
scriptsToRemove.forEach(script => {
  const filePath = path.join(rootDir, 'scripts', script);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${script}`);
    } else {
      console.log(`⚠️ File not found: ${script}`);
    }
  } catch (error) {
    console.error(`❌ Error removing ${script}:`, error.message);
  }
});

// Remove unnecessary server test files
const serverFilesToRemove = [
  'testEmail.ts',
  'testEmailConfig.ts'
];

console.log('\nRemoving unnecessary server test files...');
serverFilesToRemove.forEach(file => {
  const filePath = path.join(rootDir, 'server', file);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${file}`);
    } else {
      console.log(`⚠️ File not found: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error removing ${file}:`, error.message);
  }
});

console.log('\nCodebase cleanup completed!');
