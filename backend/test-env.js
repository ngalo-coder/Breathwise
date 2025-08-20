#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Current working directory:', process.cwd());

// Try to load .env file from backend directory
const envPath = `${__dirname}/.env`;
console.log('Looking for .env file at:', envPath);

if (fs.existsSync(envPath)) {
  console.log('.env file found!');
  dotenv.config({ path: envPath });
} else {
  console.log('.env file not found at specified path');
}

console.log('Environment variables loaded:');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '✅ Present' : '❌ Missing');
console.log('WEATHERAPI_KEY:', process.env.WEATHERAPI_KEY ? '✅ Present' : '❌ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV || '❌ Missing');