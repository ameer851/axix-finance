// api-routes-fix.js - Script to fix routes not being handled correctly
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Setup path and environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read index.ts to understand routes setup
console.log('🔍 Analyzing routes setup in the server code...');

const indexFilePath = path.join(__dirname, '..', 'server', 'index.ts');
const indexContent = fs.readFileSync(indexFilePath, 'utf-8');

// Check if setupVite is being called at the right time
const viteSetupMatch = indexContent.match(/setupVite\(app,\s*server\)/);
const apiRoutesSetupMatch = indexContent.match(/setupRoutes\(app,\s*server\)/);

if (viteSetupMatch && apiRoutesSetupMatch) {
  const viteSetupIndex = indexContent.indexOf(viteSetupMatch[0]);
  const apiRoutesSetupIndex = indexContent.indexOf(apiRoutesSetupMatch[0]);

  console.log(`API routes setup at position: ${apiRoutesSetupIndex}`);
  console.log(`Vite setup at position: ${viteSetupIndex}`);

  if (viteSetupIndex < apiRoutesSetupIndex) {
    console.log('❌ Problem detected: Vite catch-all route is registered before API routes!');
    console.log('   This means Vite is intercepting API requests and returning HTML instead of JSON.');

    // Create fix for index.ts
    let updatedContent = indexContent;
    
    // Find the setupVite call and move it after setupRoutes
    const viteSetupLine = updatedContent.split('\n').find(line => line.includes('setupVite(app, server)'));
    const apiRoutesLine = updatedContent.split('\n').find(line => line.includes('setupRoutes(app, server)'));
    
    if (viteSetupLine && apiRoutesLine) {
      // Remove the setupVite line
      updatedContent = updatedContent.replace(viteSetupLine, '');
      
      // Find the line with setupRoutes and add setupVite after it
      updatedContent = updatedContent.replace(
        apiRoutesLine,
        `${apiRoutesLine}\n  await setupVite(app, server); // Moved after API routes to prevent catch-all interference`
      );
      
      // Write the changes back to index.ts
      fs.writeFileSync(indexFilePath + '.backup', indexContent, 'utf-8'); // Create backup
      fs.writeFileSync(indexFilePath, updatedContent, 'utf-8');
      
      console.log('✅ Created fix: Moved Vite setup after API routes in index.ts');
      console.log('   Backup of original file created at: index.ts.backup');
    } else {
      console.log('❌ Could not find setup lines to modify.');
    }
  } else {
    console.log('✅ Route order looks good! API routes are registered before Vite catch-all route.');
  }
} else {
  console.log('❓ Could not find both setupVite and setupRoutes calls in index.ts');
  
  // Alternative approach: Create direct API route patch for the specific endpoints
  console.log('\n🔧 Creating direct API route patches for endpoints...');
  
  // Create a file with direct patches for the missing routes
  const patchFilePath = path.join(__dirname, '..', 'server', 'route-patches.ts');
  const patchContent = `
// route-patches.ts - Direct API route fixes for admin endpoints
import { Express, Request, Response } from "express";
import { DatabaseStorage } from "./storage";

// Create a storage instance
const storage = new DatabaseStorage();

export function applyRoutePatches(app: Express) {
  console.log('📝 Applying route patches for admin endpoints...');
  
  // Dashboard stats endpoint
  app.get('/api/admin/dashboard-stats', async (req, res) => {
    try {
      // Get basic stats
      const userCount = await storage.getUserCount();
      const transactionCount = await storage.getTransactionCount();
      
      // Return dashboard stats
      res.json({
        users: {
          total: userCount,
          active: userCount // Simplified for patch
        },
        transactions: {
          total: transactionCount,
          pending: 0 // Simplified for patch
        },
        system: {
          status: 'operational',
          version: '1.0.0'
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  });

  // Active visitors endpoint
  app.get('/api/admin/active-visitors', async (req, res) => {
    try {
      // Return placeholder data for active visitors
      res.json({
        activeVisitors: [],
        totalCount: 0
      });
    } catch (error) {
      console.error('Error fetching active visitors:', error);
      res.status(500).json({ error: 'Failed to fetch active visitors' });
    }
  });
  
  // User stats endpoint
  app.get('/api/admin/users/stats', async (req, res) => {
    try {
      const userCount = await storage.getUserCount();
      
      // Return user stats
      res.json({
        total: userCount,
        verified: userCount, // Simplified for patch
        unverified: 0, // Simplified for patch
        active: userCount, // Simplified for patch
        inactive: 0 // Simplified for patch
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
  });
  
  console.log('✅ Route patches applied successfully');
}
`;

  fs.writeFileSync(patchFilePath, patchContent, 'utf-8');
  console.log(`✅ Created route patches file at: ${patchFilePath}`);
  
  // Create a script to apply the patches
  const applyPatchesPath = path.join(__dirname, 'apply-patches.js');
  const applyPatchesContent = `
// apply-patches.js - Script to apply route patches
import { applyRoutePatches } from '../server/route-patches.js';
import express from 'express';

// Create a test app to verify patches
const app = express();

// Apply patches
applyRoutePatches(app);

console.log('✅ Patches have been created and are ready to apply.');
console.log('');
console.log('To apply these patches, add the following line in index.ts:');
console.log('');
console.log('import { applyRoutePatches } from "./route-patches.js";');
console.log('// Then add this line after setupRoutes but before setupVite:');
console.log('applyRoutePatches(app);');
`;

  fs.writeFileSync(applyPatchesPath, applyPatchesContent, 'utf-8');
  console.log(`✅ Created patch application script at: ${applyPatchesPath}`);
}

console.log('\n📋 Next steps:');
console.log('1. Restart your server to apply changes');
console.log('2. Check if the admin dashboard endpoints are now returning JSON data');
console.log('3. If problems persist, try modifying the source code directly');
