#!/usr/bin/env node

/**
 * Axix Finance - Vercel Environment Generator
 * 
 * This script generates a template for your Vercel environment variables
 * based on your .env.example file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🌐 Axix Finance - Vercel Environment Generator\n');

// Check if .env.example exists
const envExamplePath = path.join(__dirname, '.env.example');
if (!fs.existsSync(envExamplePath)) {
  console.error('❌ .env.example file not found. Please create one first.');
  process.exit(1);
}

// Read .env.example
const envExample = fs.readFileSync(envExamplePath, 'utf8');

// Parse variables
const variables = [];
const lines = envExample.split('\n');
let currentSection = null;

for (const line of lines) {
  // Check for section comments
  if (line.startsWith('# ') && !line.includes('=')) {
    currentSection = line.substring(2).trim();
    continue;
  }
  
  // Parse variable lines
  const match = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
  if (match) {
    const [, name, exampleValue] = match;
    variables.push({
      name,
      exampleValue,
      section: currentSection,
    });
  }
}

// Generate output
let output = '# Vercel Environment Variables for Axix Finance\n\n';
output += 'Copy and paste these variables into your Vercel project settings.\n';
output += 'Replace example values with your actual production values.\n\n';

let currentOutputSection = null;

for (const variable of variables) {
  if (variable.section !== currentOutputSection) {
    currentOutputSection = variable.section;
    output += `\n## ${currentOutputSection}\n\n`;
  }
  
  output += `# ${variable.name}\n`;
  output += `# Example: ${variable.exampleValue}\n`;
  output += `${variable.name}=\n\n`;
}

// Write to file
const outputPath = path.join(__dirname, 'vercel-environment-template.txt');
fs.writeFileSync(outputPath, output);

console.log(`✅ Template generated: ${outputPath}`);
console.log('\nInstructions:');
console.log('1. Open the generated file');
console.log('2. Fill in your actual production values');
console.log('3. Copy these values to your Vercel project settings');
console.log('4. Delete the template file before committing (it contains sensitive info)\n');
