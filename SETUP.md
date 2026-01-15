# Setup Guide

Complete setup instructions for Maximus Engagimus.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- At least one AI provider API key (free options available)

## 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd maximus-engagimus

# Install dependencies
npm install
```

> ✅ Completed locally: dependencies installed (`npm install`).
## 2. Supabase Setup

### Create a Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned (takes ~2 minutes)
3. Go to Project Settings > API to get your credentials

### Run Database Schema

1. Open the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/schema.sql`
3. Paste and run in the SQL Editor
4. This creates all tables, RLS policies, and seed data

### Enable Authentication

1. Go to Authentication > Providers
2. Ensure Email provider is enabled
3. Configure Site URL in Authentication > URL Configuration:
   - Site URL: `http://localhost:5173` (for development)
   - Redirect URLs: `http://localhost:5173/**`

## 3. Environment Variables

> E2E tests: create a `.env.test` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` if you want to run Playwright E2E locally (see README for details).


```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your values:

> ✅ Completed locally: `.env` created and Supabase vars populated (kept private).
```env
# Supabase (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Providers (add at least one)
VITE_GROQ_API_KEY=your-groq-key
VITE_CEREBRAS_API_KEY=your-cerebras-key
VITE_GEMINI_API_KEY=your-gemini-key
VITE_OPENROUTER_API_KEY=your-openrouter-key
VITE_MISTRAL_API_KEY=your-mistral-key
VITE_DEEPSEEK_API_KEY=your-deepseek-key
VITE_OPENAI_API_KEY=your-openai-key
VITE_ANTHROPIC_API_KEY=your-anthropic-key
```

### Getting API Keys

#### Free Options

| Provider | Sign Up | Free Tier |
|----------|---------|-----------|
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | 14,400 requests/day |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai) | 1M tokens/day |
| Google Gemini | [makersuite.google.com](https://makersuite.google.com/app/apikey) | 1,000 requests/day |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | 50 requests/day |
| Mistral | [console.mistral.ai](https://console.mistral.ai/api-keys) | 1B tokens/month |

#### Paid Options

| Provider | Sign Up | Pricing |
|----------|---------|---------|
| DeepSeek | [platform.deepseek.com](https://platform.deepseek.com/api_keys) | ~$0.0002/comment |
| OpenAI | [platform.openai.com](https://platform.openai.com/api-keys) | ~$0.001/comment |
| Anthropic | [console.anthropic.com](https://console.anthropic.com) | ~$0.001/comment |

## 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> ✅ Completed locally: Dev server started and app rendered in browser (Vite configured for `src` root and host binding).

## 5. Create Your Account

1. Click "Sign Up" on the login page
2. Enter your email, password, and organization name
3. Check your email for the confirmation link
4. Click the link to verify your account
5. Sign in with your credentials

## 6. Configure AI Providers

1. Go to Settings > AI Providers
2. Click "Add Default Providers" to seed the provider list
3. Click on a provider to edit it
4. Add your API key
5. Toggle "Active" to enable it
6. Click "Test" to verify the connection
7. Set your preferred provider as "Default"

## 7. Add Your First Client

1. Go to Clients > Add Client
2. Fill in the basic information:
   - **Name**: Client's business name
   - **Industry**: Select from dropdown
   - **Description**: Brief overview
3. Create a voice prompt:
   ```
   Speak as a knowledgeable [industry] expert. Use friendly, 
   conversational language while demonstrating expertise. 
   Avoid jargon. Be helpful and genuine. Reference real-world 
   experience when appropriate.
   ```
4. Add 2-3 sample comments that match the desired style
5. Add keywords for content matching

## 8. Generate Your First Comments

1. Go to Generator
2. Select your client
3. Choose the platform (Instagram, LinkedIn, etc.)
4. Paste the content you want to respond to
5. Click "Generate Comments"
6. Review the options and copy your favorite

---

## Production Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

### Environment Variables for Production

Update your `.env` or hosting platform with production values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
# Add production AI provider keys
```

### Recommended Hosting

- **Vercel**: Automatic deploys from Git
- **Netlify**: Similar to Vercel
- **Cloudflare Pages**: Fast edge deployment

### Supabase Production Checklist

1. Enable email confirmations (Authentication > Settings)
2. Set up custom SMTP for email delivery
3. Update Site URL to your production domain
4. Review and enable RLS policies
5. Set up database backups
6. Consider enabling Point-in-Time Recovery

---

## Troubleshooting

### "No AI providers configured"

1. Go to Settings > AI Providers
2. Add an API key to at least one provider
3. Ensure the provider is set to "Active"

### "Failed to generate comments"

1. Check the browser console for errors
2. Test your AI provider connection in Settings
3. Verify your API key is correct
4. Check if you've hit rate limits

### "Authentication error"

1. Clear browser cache and cookies
2. Verify Supabase URL and anon key are correct
3. Check Supabase dashboard for authentication errors
4. Ensure email confirmation link was clicked

### Database connection issues

1. Verify Supabase project is running
2. Check RLS policies are enabled
3. Ensure schema.sql was run successfully
4. Check for any migration errors in Supabase logs

---

## Optional: API Key Storage with Supabase Vault

For production, store API keys in Supabase Vault instead of the database:

```sql
-- Create a secret
SELECT vault.create_secret('groq_api_key', 'your-actual-key');

-- Read a secret (in a function)
SELECT decrypted_secret FROM vault.decrypted_secrets 
WHERE name = 'groq_api_key';
```

Then modify `src/lib/supabase.js` to fetch keys from Vault instead of the providers table.

---

## Need Help?

- Check the browser console for detailed error messages
- Review Supabase logs in the dashboard
- Ensure all environment variables are set correctly
- Verify AI provider API keys are valid and have available quota
