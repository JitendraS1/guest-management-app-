# Shadcn-UI Template Usage Instructions

## Technology Stack

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (for backend database and authentication)

All shadcn/ui components have been downloaded under `@/components/ui`.

## File Structure

- `index.html` - HTML entry point
- `vite.config.ts` - Vite configuration file
- `tailwind.config.js` - Tailwind CSS configuration file
- `package.json` - NPM dependencies and scripts
- `src/app.tsx` - Root component of the project
- `src/main.tsx` - Project entry point
- `src/index.css` - Existing CSS configuration

## Components

- All shadcn/ui components are pre-downloaded and available at `@/components/ui`

## Styling

- Add global styles to `src/index.css` or create new CSS files as needed
- Use Tailwind classes for styling components

## Development

- Import components from `@/components/ui` in your React components
- Customize the UI by modifying the Tailwind configuration

## Note

The `@/` path alias points to the `src/` directory

# Commands

**Install Dependencies**

```shell
pnpm i
```

**Start Preview**

```shell
pnpm run dev
```

**To build**

```shell
pnpm run build
```

**To deploy to Vercel**

```shell
pnpm run deploy
```

Alternatively, follow the instructions in `deploy-to-vercel.md` for deploying through the Vercel web interface.

# Supabase Integration

This project uses Supabase for backend database and authentication. To set up Supabase:

1. See the detailed setup instructions in `SUPABASE_SETUP.md`
2. Create a Supabase account and project at [supabase.com](https://supabase.com)
3. Run the SQL script in `supabase-schema.sql` in your Supabase SQL Editor
4. Update the `.env` file with your Supabase project URL and anon key

# Deployment to Vercel

This project is configured for easy deployment to Vercel. Follow these steps:

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign up/login
3. Click "New Project" and import your GitHub repository
4. Configure the project:
   - Framework Preset: Vite
   - Build Command: npm run build (already configured in vercel.json)
   - Output Directory: dist (already configured in vercel.json)
5. Add environment variables:
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with your Supabase credentials
6. Click "Deploy"

The application includes a `vercel.json` configuration file that handles SPA routing and other Vercel-specific settings.
