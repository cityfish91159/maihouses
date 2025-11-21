# Vercel Environment Variables Guide

Move the following variables from your local `.env` files to Vercel Project Settings > Environment Variables.

## Backend / Serverless (Do NOT expose to browser)
These variables are used by API routes (`api/`) and should **never** be prefixed with `VITE_` or `NEXT_PUBLIC_`.

| Variable Name | Description |
| :--- | :--- |
| `OPENAI_API_KEY` | Your OpenAI API Key (sk-...) |
| `REPLICATE_API_TOKEN` | Replicate AI Token |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (for admin tasks/RLS bypass) |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key (if used) |

## Frontend (Exposed to browser)
These variables will be bundled into your JavaScript code. Only put public keys here.

| Variable Name | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anonymous Key |
| `VITE_AI_PROXY_URL` | URL to your backend proxy (e.g., `/api/chat`) |

## Action Items
1. Go to Vercel Dashboard.
2. Select your project.
3. Go to **Settings** > **Environment Variables**.
4. Add the variables listed above.
5. Redeploy your project for changes to take effect.
