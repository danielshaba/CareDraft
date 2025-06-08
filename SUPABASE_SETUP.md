# Supabase Configuration Guide

This document provides complete setup instructions for the CareDraft Supabase integration, configured using MCP tools.

## 🚀 Quick Setup

Your Supabase project is already configured and ready! Run this command to complete the setup:

```bash
npm run setup:supabase
```

This will:
- ✅ Create `.env.local` with correct Supabase credentials
- ✅ Validate configuration
- ✅ Provide next steps

## 📊 Project Details

- **Project Name**: CareDraft
- **Project ID**: `ptikiknjujllkazyeeaz`
- **Region**: `eu-west-2` (Europe West - London)
- **Status**: ACTIVE_HEALTHY
- **Database**: PostgreSQL 17.4.1.037

## 🏗️ Project Structure

The CareDraft application is located in the `caredraft/` subdirectory:

```
CareDraft/
├── caredraft/           # Main Next.js application
│   ├── app/            # Next.js 13+ app directory
│   ├── components/     # React components
│   ├── lib/           # Utility functions and configs
│   ├── package.json   # Application dependencies
│   └── .env.local     # Environment variables (auto-generated)
├── scripts/           # Setup and utility scripts
├── package.json       # Root package.json (proxies to caredraft/)
└── SUPABASE_SETUP.md  # This documentation
```

## 🔧 Configuration

### Environment Variables

The following environment variables are automatically configured in `caredraft/.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ptikiknjujllkazyeeaz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Database Schema

Your database includes the following tables:

1. **users** - User accounts and profiles
2. **organizations** - Organization management
3. **proposals** - Proposal documents and metadata
4. **sections** - Proposal sections and content
5. **compliance_items** - Compliance tracking
6. **answer_bank** - Reusable content library
7. **research_sessions** - Research data and results

## 🧪 Testing

Test your Supabase connection:

```bash
npm run test:supabase
```

This will verify:
- ✅ Environment variables are set
- ✅ Configuration format is valid
- ✅ Connection to Supabase works
- ✅ Database tables are accessible

## 🔑 Additional API Keys

Add these to your `caredraft/.env.local` file as needed:

```env
# OpenAI Configuration (for AI features)
OPENAI_API_KEY=your_openai_api_key
PRIMARY_OPENAI_MODEL=gpt-4.1-mini
FALLBACK_OPENAI_MODEL=gpt-4.1-nano

# Email Service (for notifications)
RESEND_API_KEY=your_resend_api_key

# Search APIs (for research features)
SERPER_API_KEY=your_serper_api_key
TAVILY_API_KEY=your_tavily_api_key

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

## 🔗 Useful Links

- **Dashboard**: https://supabase.com/dashboard/project/ptikiknjujllkazyeeaz
- **Database Editor**: https://supabase.com/dashboard/project/ptikiknjujllkazyeeaz/editor
- **Authentication**: https://supabase.com/dashboard/project/ptikiknjujllkazyeeaz/auth/users
- **API Settings**: https://supabase.com/dashboard/project/ptikiknjujllkazyeeaz/settings/api
- **Storage**: https://supabase.com/dashboard/project/ptikiknjujllkazyeeaz/storage/buckets

## 🛠️ Development

Start the development server from the project root:

```bash
npm run dev
```

Or directly from the caredraft directory:

```bash
cd caredraft && npm run dev
```

The application will be available at `http://localhost:3000`.

## 🔒 Security Notes

- ✅ Anonymous key is safe for client-side use
- ✅ Row Level Security (RLS) is enabled on all tables
- ✅ Service role key should only be used server-side
- ✅ Environment variables are properly configured

## 📝 TypeScript Types

Database types are automatically generated and available in:
- `lib/database.types.ts` - Complete type definitions
- `lib/supabase-config.ts` - Configuration helpers

## 🆘 Troubleshooting

### Connection Issues

1. Verify environment variables:
   ```bash
   npm run test:supabase
   ```

2. Check `caredraft/.env.local` file exists and contains correct values

3. Ensure you're running the server from the correct directory:
   ```bash
   npm run dev  # From project root
   # OR
   cd caredraft && npm run dev  # From caredraft directory
   ```

### "localhost refused to connect" Error

This means the development server isn't running. Start it with:
```bash
npm run dev
```

The server will start from the `caredraft/` directory automatically.

### Database Access Issues

1. Verify RLS policies in the Supabase dashboard
2. Check user authentication status
3. Confirm table permissions

### Need Help?

- Check the [Supabase Documentation](https://supabase.com/docs)
- Visit the [CareDraft Dashboard](https://supabase.com/dashboard/project/ptikiknjujllkazyeeaz)
- Run the setup script again: `npm run setup:supabase`

## 🔄 Re-running Setup

If you need to reconfigure Supabase:

```bash
npm run setup:supabase
```

This will backup your existing `.env.local` and create a new one with the latest configuration.

---

*Configuration generated using Supabase MCP tools on ${new Date().toISOString()}* 