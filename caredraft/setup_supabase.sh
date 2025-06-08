#!/bin/bash

echo "🚀 CareDraft Supabase Setup"
echo "=========================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

echo "This script will help you update your Supabase credentials."
echo ""
echo "You have two options:"
echo "1. Create a new Supabase project at https://supabase.com"
echo "2. Use an existing Supabase project"
echo ""

# Get Supabase URL
echo "📝 Please enter your Supabase Project URL:"
echo "   (e.g., https://your-project-ref.supabase.co)"
read -p "Supabase URL: " SUPABASE_URL

# Validate URL format
if [[ ! $SUPABASE_URL =~ ^https://.*\.supabase\.co$ ]]; then
    echo "❌ Invalid URL format. Should be like: https://your-project-ref.supabase.co"
    exit 1
fi

# Get Supabase Anon Key
echo ""
echo "📝 Please enter your Supabase Anonymous Key:"
echo "   (Found in Project Settings > API > Project API keys > anon public)"
read -p "Anon Key: " SUPABASE_ANON_KEY

# Validate anon key format (should start with eyJ)
if [[ ! $SUPABASE_ANON_KEY =~ ^eyJ ]]; then
    echo "❌ Invalid anon key format. Should start with 'eyJ'"
    exit 1
fi

# Backup current .env.local
cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backed up current .env.local"

# Update .env.local
sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|" .env.local
sed -i.bak "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|" .env.local

# Remove backup file created by sed
rm .env.local.bak

echo ""
echo "✅ Updated .env.local with new Supabase credentials"
echo ""
echo "📋 Next steps:"
echo "1. Make sure your Supabase project has the required database tables"
echo "2. Configure Row Level Security (RLS) policies if needed"
echo "3. Set up authentication providers in your Supabase dashboard"
echo "4. Restart your development server: npm run dev"
echo ""
echo "🔗 Useful Supabase Dashboard links:"
echo "   • Project Settings: $SUPABASE_URL/project/default/settings/general"
echo "   • Database Tables: $SUPABASE_URL/project/default/editor"
echo "   • Authentication: $SUPABASE_URL/project/default/auth/users"
echo ""
echo "🎉 Setup complete! Your application should now connect to Supabase." 