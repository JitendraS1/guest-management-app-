// Simple script to help deploy to Vercel
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if Vercel CLI is installed
try {
  console.log('Checking for Vercel CLI...');
  execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.error('Vercel CLI is not installed. Installing...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
  } catch (installError) {
    console.error('Failed to install Vercel CLI. Please install it manually with: npm install -g vercel');
    process.exit(1);
  }
}

// Check if .env file exists
if (!fs.existsSync(path.join(process.cwd(), '.env'))) {
  console.warn('Warning: No .env file found. Make sure your Supabase environment variables are configured in Vercel.');
}

// Check if vercel.json exists
if (!fs.existsSync(path.join(process.cwd(), 'vercel.json'))) {
  console.error('Error: vercel.json not found. Please make sure it exists in your project root.');
  process.exit(1);
}

// Deploy to Vercel
console.log('Deploying to Vercel...');
try {
  execSync('vercel', { stdio: 'inherit' });
  console.log('\nDeployment initiated! Follow the prompts from Vercel CLI to complete deployment.');
  console.log('\nRemember to set your Supabase environment variables in the Vercel dashboard:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_ANON_KEY');
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}