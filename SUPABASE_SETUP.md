# Supabase Setup Guide

## Overview

This project uses Supabase as the backend database and authentication provider. Follow these steps to set up your Supabase project.

## Steps to Set Up Supabase

### 1. Create a Supabase Account

- Go to [Supabase](https://supabase.com/) and sign up for an account if you don't have one
- Create a new project in your Supabase dashboard

### 2. Set Up Database Tables

- Navigate to the SQL Editor in your Supabase dashboard
- Copy and paste the contents of `supabase-schema.sql` from this project
- Run the SQL script to create the necessary tables and policies

### 3. Configure Environment Variables

- In your Supabase project dashboard, go to Settings > API
- Copy your project URL and anon key
- Create a `.env` file in the root of this project with the following content:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Update Supabase Configuration

- Open `src/lib/supabase.ts`
- Replace the hardcoded URL and key with environment variables:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## Database Schema

### Events Table

| Column      | Type      | Description                |
|-------------|-----------|----------------------------|
| id          | UUID      | Primary key                |
| name        | TEXT      | Event name                 |
| description | TEXT      | Event description          |
| date        | TEXT      | Event date                 |
| location    | TEXT      | Event location             |
| created_at  | TIMESTAMP | Creation timestamp         |
| updated_at  | TIMESTAMP | Last update timestamp      |

### Guests Table

| Column        | Type      | Description                |
|---------------|-----------|----------------------------|
| id            | UUID      | Primary key                |
| name          | TEXT      | Guest name                 |
| email         | TEXT      | Guest email                |
| phone         | TEXT      | Guest phone (optional)     |
| invite_code   | TEXT      | Unique invite code         |
| is_present    | BOOLEAN   | Check-in status            |
| checked_in_at | TIMESTAMP | Check-in timestamp         |
| event_id      | UUID      | Foreign key to events      |
| created_at    | TIMESTAMP | Creation timestamp         |
| updated_at    | TIMESTAMP | Last update timestamp      |

## Using Supabase in the Application

The application is already configured to use Supabase for data storage. The main integration points are:

- `src/lib/supabase.ts` - Contains the Supabase client and data operations
- `src/lib/storage.ts` - Provides a unified interface for data operations

All components interact with the database through the `storage` interface, which in turn uses the Supabase operations defined in `supabase.ts`.

## Deploying with Supabase to Vercel

When deploying this application to Vercel, you need to configure the Supabase environment variables:

1. In your Vercel project settings, go to the "Environment Variables" section
2. Add the following variables with your Supabase project values:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. These variables will be used during the build process and in the deployed application

Note: Never commit your actual Supabase credentials to your repository. Use the `.env.example` file as a template and add your actual values to the `.env` file, which should be included in `.gitignore`.