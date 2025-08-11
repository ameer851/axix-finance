#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const distDir = path.join(process.cwd(), 'dist');
const indexFile = path.join(distDir, 'index.html');
function fail(msg){ console.error(`❌ Build verification failed: ${msg}`); process.exit(1);} 
if(!fs.existsSync(distDir)) fail('dist directory not found at project root (expected ./dist).');
if(!fs.existsSync(indexFile)) fail('dist/index.html not found. Ensure Vite built the client.');
const stats = fs.statSync(indexFile);
if(stats.size < 500) console.warn('⚠️ dist/index.html is unusually small (<500 bytes).');
console.log('✅ dist verification passed (root script).');
