# Maximus Engagimus

A social media engagement tool for agencies. Generate authentic, client-specific comments at scale using AI.

![Pokémon Blue Theme](https://img.shields.io/badge/theme-Pok%C3%A9mon%20Blue-3B4CCA)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5-646CFF)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E)

## 🎯 Overview

Maximus Engagimus helps marketing agencies manage social media engagement across multiple clients. It uses AI to generate platform-specific comments that match each client's voice and style.

### Key Features

- **🤖 AI Comment Generation** - Generate 1-5 comment options per request with different styles (conversational, professional, question-based, value-add, brief)
- **👥 Multi-Client Management** - Manage unlimited clients with custom voice prompts, sample comments, and industry keywords
- **📊 Content Analyzer** - Paste any content to automatically match it to relevant clients based on keywords
- **🔍 Competitor Tracking** - Track where competitors engage and log sightings across platforms
- **📈 History & Analytics** - View generation history, track usage rates, and monitor engagement patterns
- **⚡ Multi-Provider AI** - Support for 8+ AI providers with automatic fallback (Groq, Cerebras, Gemini, OpenRouter, Mistral, DeepSeek, OpenAI, Anthropic)
- **📋 "No API" Mode** - Copy prompts to use with any AI chat interface (ChatGPT, Claude, etc.)

## 🚀 Quick Start

See [SETUP.md](./SETUP.md) for detailed installation instructions.

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase and AI provider credentials

# 3. Run database migrations
# Import supabase/schema.sql into your Supabase project

# 4. Start development server
npm run dev
```

> ✅ Local dev verified: dependencies installed, `.env` configured, and dev server runs (app renders).

---

## ✅ CI & QA (A11y + Visual)

- This project runs an accessibility color-contrast audit (axe) and a Playwright visual QA on push and pull requests via GitHub Actions.

- Run the checks locally:

```bash
# visual QA (captures desktop/tablet/mobile screenshots)
npm run visual:qa

# accessibility color-contrast audit (runs axe and writes results to visual-screenshots/)
npm run a11y:audit
```

- CI Badge (replace `OWNER/REPO` with your GitHub repository):

![A11y & Visual QA](https://img.shields.io/github/actions/workflow/status/OWNER/REPO/a11y-and-visual-qa.yml?branch=main)

> The workflow uploads artifacts (screenshots + `axe-color-contrast.json`) to the workflow run so reviewers can inspect visual diffs and accessibility findings.

---

## 📁 Project Structure

```
maximus-engagimus/
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── ui/             # Reusable UI components (Button, Input, Modal, etc.)
│   │   ├── layout/         # App shell (Sidebar, Header, Layout)
│   │   ├── clients/        # Client management components
│   │   ├── generator/      # Comment generator components
│   │   ├── competitors/    # Competitor tracking components
│   │   ├── settings/       # Settings page components
│   │   ├── dashboard/      # Dashboard widgets
│   │   └── common/         # Shared components (EmptyState, ErrorBoundary)
│   ├── contexts/           # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and services
│   │   ├── supabase.js     # Supabase client and data layer
│   │   ├── ai.js           # AI provider integration
│   │   ├── prompts.js      # Prompt templates
│   │   └── utils.js        # Helper functions
│   ├── pages/              # Route pages
│   ├── App.jsx             # Main app with routing
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── supabase/
│   └── schema.sql          # Database schema and seed data
├── .env.example            # Environment template
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🎨 Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **AI**: OpenAI-compatible providers (Groq, Cerebras, Gemini, etc.)
- **Icons**: Lucide React
- **Routing**: React Router v6

## 📚 Features in Detail

### Comment Generator

1. Select a client and platform
2. Paste the content you want to respond to
3. Optionally add existing comments (AI will avoid similar phrasing)
4. Choose number of options (1-5) and whether to include a CTA
5. Click "Generate" to create AI-powered comment options
6. Copy your favorite and mark it as "Used" for tracking

### Client Profiles

Each client includes:
- **Voice Prompt**: Core personality and style guide
- **Voice Prompt (with CTA)**: Variation for promotional comments
- **Sample Comments**: Examples the AI learns from
- **Keywords**: For content matching in the Analyzer
- **Industry Sites**: Relevant platforms for engagement
- **Default CTA**: Soft promotional pitch

### Platform Support

- Instagram
- Facebook
- LinkedIn
- X (Twitter)
- TikTok
- Reddit
- YouTube
- Houzz
- Forums
- Other

### AI Providers

The app supports any OpenAI-compatible API:

| Provider | Free Tier | Speed | Notes |
|----------|-----------|-------|-------|
| Groq | ✅ 14,400 req/day | ⚡⚡⚡ | Recommended for free tier |
| Cerebras | ✅ 1M tokens/day | ⚡⚡⚡ | Fastest inference |
| Google Gemini | ✅ 1,000 req/day | ⚡⚡ | Flash-Lite model |
| OpenRouter | ✅ 50 req/day | ⚡⚡ | Multi-model access |
| Mistral | ✅ 1B tokens/mo | ⚡⚡ | Strong quality |
| DeepSeek | 💰 5M free credits | ⚡⚡ | Very affordable |
| OpenAI | 💰 Pay as you go | ⚡⚡ | High quality |
| Anthropic | 💰 Pay as you go | ⚡⚡ | High quality |

## 🔒 Security

- Row Level Security (RLS) ensures data isolation between organizations
- API keys are stored encrypted (use Supabase Vault in production)
- All database access is scoped to the user's organization
- No external tracking or analytics

## 🤝 Contributing

This is a private tool built for agency use. For feature requests or bug reports, contact the development team.

## 📄 License

Proprietary - All rights reserved.

---

Built with 💙 and the power of Pokémon Blue (#3B4CCA)
