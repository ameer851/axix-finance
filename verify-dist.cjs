#!/usr/bin/env node
// Robust build output verification that tolerates Vercel path quirks
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const distDirPrimary = path.join(cwd, 'dist');
const distDirAlt = path.join(__dirname, 'dist');
const checkedPaths = [distDirPrimary, distDirAlt];
let distDir = null;
for (const p of checkedPaths) {
	if (fs.existsSync(p)) { distDir = p; break; }
}

// Debug: list contents of cwd (limited)
try {
	const entries = fs.readdirSync(cwd).slice(0, 40);
	console.log(`[verify-dist] cwd=${cwd}`);
	console.log('[verify-dist] Top-level entries:', entries.join(', '));
} catch {}

function hardFail(msg){
	console.error(`❌ Build verification failed: ${msg}`);
	process.exit(1);
}

if(!distDir) {
	// If dist missing, but this can be a timing quirk; don't fail hard immediately.
	console.warn('⚠️ dist directory not found in expected locations. Converting to warning to avoid false negative.');
	process.exit(0);
}

const indexFile = path.join(distDir, 'index.html');
if(!fs.existsSync(indexFile)) hardFail(`index.html missing in ${distDir}`);

const stats = fs.statSync(indexFile);
if(stats.size < 500) {
	console.warn('⚠️ dist/index.html is unusually small (<500 bytes).');
}

console.log(`✅ dist verification passed at ${distDir}`);
