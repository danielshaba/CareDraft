# 🔧 CareDraft Environment Setup Guide

## Quick Start

Create a `.env.local` file in the `caredraft` directory with the following configuration:

```bash
# ==================================================
# CareDraft Environment Configuration
# ==================================================

# --------------------------------------------------
# OpenAI Configuration (Required for AI features)
# --------------------------------------------------
OPENAI_API_KEY=your_actual_openai_api_key
PRIMARY_OPENAI_MODEL=ftjob-GEQ7rH6zO5uHGenTo81wAm2I:caredraft-v2
FALLBACK_OPENAI_MODEL=ftjob-4cCrjAiMMhDNZgOAPr06Sr3w:caredraft-v1

# --------------------------------------------------
# Supabase Configuration (Required for database)
# --------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://ptikiknjujllkazyeeaz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0aWtpa25qdWpsbGthenllZWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTQ0MjEsImV4cCI6MjA2NDUzMDQyMX0.XwGS6--1PImPoDQIBQimq62qK1sLND5vY6Cr7qaZuTE
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# --------------------------------------------------
# Application Configuration
# --------------------------------------------------
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🚀 Step-by-Step Setup

### 1. Create Environment File
```bash
cd caredraft
touch .env.local
```

### 2. Get Your OpenAI API Key
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new secret key (or use your existing project key)
3. Copy the key (starts with `sk-proj-` for project keys)
4. Add to `.env.local` as `OPENAI_API_KEY=sk-proj-your_key_here`

> 🔐 **Security Note**: Never commit your actual API key to GitHub! Keep it only in your local `.env.local` file.

### 3. Get Supabase Keys
The Supabase project is already configured. You need the anonymous key:

1. Visit your [Supabase Dashboard](https://supabase.com/dashboard/project/ptikiknjujllkazyeeaz)
2. Go to Settings → API
3. Copy the `anon` public key
4. Add to `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0aWtpa25qdWpsbGthenllZWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTQ0MjEsImV4cCI6MjA2NDUzMDQyMX0.XwGS6--1PImPoDQIBQimq62qK1sLND5vY6Cr7qaZuTE`

### 4. Verify Setup
After setting up the environment file, test the configuration:

```bash
npm run dev
```

Visit `http://localhost:3000` - you should see the CareDraft interface without errors.

## 🔍 Model Recommendations

### Custom Fine-Tuned Models (CareDraft Optimized)
- **Primary**: `ftjob-GEQ7rH6zO5uHGenTo81wAm2I:caredraft-v2` - GPT-4.1 Mini fine-tuned for CareDraft
- **Fallback**: `ftjob-4cCrjAiMMhDNZgOAPr06Sr3w:caredraft-v1` - GPT-4.1 Nano fine-tuned for CareDraft

> ⚠️ **Important**: These models are currently fine-tuning. Do not interrupt the process.

### Standard Models (if fine-tuned models unavailable)
- `gpt-4o-mini` - Standard OpenAI model
- `gpt-4o` - More capable but higher cost

## 🛠 Troubleshooting

### Common Issues

**Error: "OpenAI API key is required"**
- Ensure your `.env.local` file exists in the `caredraft` directory
- Verify the API key starts with `sk-` and is valid
- Restart your development server after adding the key

**Error: "Supabase client error"**
- Check that both Supabase environment variables are set
- Verify the project URL matches the CareDraft project
- Ensure the anon key is correct and not expired

**AI Features Not Working**
- Confirm OpenAI API key has sufficient credits
- Check browser console for detailed error messages
- Verify the model names match available OpenAI models

### Testing AI Integration
Test individual AI endpoints:
- `/api/ai/extract` - Document extraction
- `/api/ai/brainstorm` - Idea generation  
- `/api/ai/rewrite` - Content rewriting
- `/api/ai/summarize` - Text summarization

## 📋 Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key for AI features |
| `PRIMARY_OPENAI_MODEL` | ✅ Yes | Primary model for complex operations |
| `FALLBACK_OPENAI_MODEL` | ✅ Yes | Fallback model for simple operations |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Optional | For admin operations |
| `NEXT_PUBLIC_APP_URL` | ⚠️ Optional | Application URL (defaults to localhost) |

## 🔐 Security Notes

- Never commit `.env.local` to version control
- Keep your API keys secure and rotate them regularly
- Use environment variables for all sensitive configuration
- The `.env.local` file is already in `.gitignore`

## ✅ Verification Checklist

- [ ] `.env.local` file created in `caredraft` directory
- [ ] OpenAI API key added and valid
- [ ] Supabase URL and anon key configured
- [ ] Development server starts without errors
- [ ] AI features work (test extract/brainstorm buttons)
- [ ] Authentication flow works (login/logout)
- [ ] File upload functionality works

Once all items are checked, your CareDraft environment is ready for development! 🎉 