# CareDraft

A comprehensive care tender management platform built with Next.js, TypeScript, and Supabase. CareDraft helps organizations streamline their tender documentation, compliance tracking, and proposal management processes.

## 🚀 Features

- **User Management**: Secure authentication and role-based access control
- **Organization Management**: Multi-tenant support with organization-specific data
- **Proposal Management**: Create, track, and manage care proposals
- **Compliance Tracking**: Monitor compliance items and ensure regulatory adherence
- **Answer Bank**: Centralized repository for reusable answers and templates
- **Research Sessions**: Track and document research activities
- **Professional Branding**: Consistent CareDraft brand identity throughout

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **Styling**: Tailwind CSS with custom CareDraft brand colors
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL with 7 core tables
- **Deployment**: Vercel-ready configuration

## 🏗️ Project Structure

```
CareDraft/
├── caredraft/                 # Main Next.js application
│   ├── app/                   # App router pages and layouts
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Utilities and configurations
│   └── public/                # Static assets
├── lib/                       # Shared library code
├── scripts/                   # Setup and utility scripts
├── .taskmaster/               # Task management configuration
└── supabase/                  # Database schema and migrations
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/caredraft.git
cd caredraft
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install main app dependencies
cd caredraft
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration (if using AI features)
OPENAI_API_KEY=your_openai_api_key
PRIMARY_OPENAI_MODEL=gpt-4-turbo-preview
FALLBACK_OPENAI_MODEL=gpt-3.5-turbo
```

### 4. Database Setup

1. Create a new Supabase project
2. Run the provided SQL schema in your Supabase SQL editor
3. Enable Row Level Security on all tables
4. Update your environment variables with the correct Supabase credentials

### 5. Run the Development Server

```bash
# From the root directory
npm run dev

# Or from the caredraft directory
cd caredraft && npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🗄️ Database Schema

The application uses 7 core tables:

- **users**: User profiles and authentication data
- **organizations**: Multi-tenant organization management
- **proposals**: Care proposals and documentation
- **sections**: Proposal sections and content structure
- **compliance_items**: Compliance tracking and monitoring
- **answer_bank**: Reusable answers and templates
- **research_sessions**: Research activity tracking

## 🎨 Brand Identity

CareDraft uses a professional teal color palette:

- **Primary Teal**: `#2A6F6F`
- **Dark Teal**: `#1F4949` 
- **Light Teal**: `#EAF7F7`

The logo features a caring hand icon with document lines, emphasizing the care-focused nature of the platform.

## 🔧 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Test Supabase connection
npm run test:supabase

# Setup Supabase configuration
npm run setup:supabase
```

## 📁 Key Files

- `caredraft/app/(auth)/login/page.tsx` - Login page with CareDraft branding
- `caredraft/components/ui/CareDraftLogo.tsx` - Reusable logo component
- `lib/database.types.ts` - TypeScript definitions for Supabase
- `lib/supabase-config.ts` - Supabase configuration and helpers
- `SUPABASE_SETUP.md` - Detailed Supabase setup instructions
- `BRANDING_IMPLEMENTATION.md` - Brand implementation guide

## 🚀 Deployment

The application is configured for easy deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Add environment variables in the Vercel dashboard
3. Deploy automatically on push to main branch

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions, please contact the CareDraft team.

---

**CareDraft** - Streamlining care management with professional excellence. 
