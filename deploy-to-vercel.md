# Deploying to Vercel

## Prerequisites

- A GitHub account
- A Vercel account (you can sign up at [vercel.com](https://vercel.com) using your GitHub account)
- Your Supabase project set up (see `SUPABASE_SETUP.md`)

## Deployment Steps

### 1. Prepare Your Repository

1. Make sure your code is in a GitHub repository
2. Ensure your `.env` file is not committed (it should be in `.gitignore`)
3. Verify that you have the `vercel.json` file in your project root

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will automatically detect that this is a Vite project

### 3. Configure Project Settings

1. Configure the project settings:
   - **Framework Preset**: Vite (should be auto-detected)
   - **Build Command**: `npm run build` (already set in vercel.json)
   - **Output Directory**: `dist` (already set in vercel.json)
   - **Install Command**: `npm install` (default)

2. Add environment variables:
   - Click on "Environment Variables"
   - Add the following variables:
     - `VITE_SUPABASE_URL` = Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = Your Supabase anonymous key

### 4. Deploy

1. Click "Deploy"
2. Wait for the build and deployment to complete
3. Once deployed, Vercel will provide you with a URL to access your application

### 5. Verify Deployment

1. Visit the provided URL
2. Test the authentication functionality
3. Verify that the application can connect to your Supabase backend

## Continuous Deployment

By default, Vercel sets up continuous deployment from your GitHub repository. Any new commits to your main branch will trigger a new deployment automatically.

## Custom Domains

To use a custom domain:

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain and follow the verification steps

## Troubleshooting

- If you encounter build errors, check the build logs in Vercel
- If the application deploys but can't connect to Supabase, verify your environment variables
- For routing issues, ensure the `vercel.json` file is correctly configured with the rewrites