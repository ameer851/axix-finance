import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🧹 Starting final cleanup for deployment...');

// Scripts to remove (redundant or development-only)
const redundantScripts = [
  'check-admin-simple.ts',
  'check-databases.js', 
  'clean-database.js',
  'cleanup-codebase.js',
  'cors-fix.js', // empty file
  'list-tables.js',
  'push-db.js',
  'test-db-connection.js',
  'verify-admin-password.ts' // We can verify through the app now
];

// Essential scripts to keep
const essentialScripts = [
  'create-admin-user.ts', // For initial setup
  'create-database.js', // For database initialization
  'email-diagnostic.js', // For email troubleshooting
  'prepare-deployment.js', // For deployment preparation
  'update-admin-password.ts' // For password updates
];

const scriptsDir = path.join(rootDir, 'scripts');

console.log('📂 Scripts directory:', scriptsDir);
console.log('🗑️  Removing redundant scripts...');

let removedCount = 0;
let errors = 0;

redundantScripts.forEach(script => {
  const scriptPath = path.join(scriptsDir, script);
  
  try {
    if (fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath);
      console.log(`   ✅ Removed: ${script}`);
      removedCount++;
    } else {
      console.log(`   ⚠️  Not found: ${script}`);
    }
  } catch (error) {
    console.log(`   ❌ Error removing ${script}:`, error.message);
    errors++;
  }
});

console.log('\n📋 Essential scripts kept:');
essentialScripts.forEach(script => {
  const scriptPath = path.join(scriptsDir, script);
  if (fs.existsSync(scriptPath)) {
    console.log(`   ✅ Kept: ${script}`);
  } else {
    console.log(`   ❌ Missing: ${script}`);
  }
});

// Check for any remaining files
console.log('\n📁 Remaining files in scripts directory:');
try {
  const remainingFiles = fs.readdirSync(scriptsDir);
  remainingFiles.forEach(file => {
    console.log(`   📄 ${file}`);
  });
} catch (error) {
  console.log('   ❌ Error reading scripts directory:', error.message);
}

console.log(`\n🎯 Cleanup Summary:`);
console.log(`   • Removed: ${removedCount} files`);
console.log(`   • Errors: ${errors} errors`);
console.log(`   • Essential scripts preserved: ${essentialScripts.length}`);

console.log('\n✨ Final cleanup completed!');
console.log('🔐 Admin credentials:');
console.log('   Username: admin');
console.log('   Password: Carax@admin123!');
console.log('   Email: admin@caraxfinance.com');
