#!/bin/bash
echo "=== CareDraft Environment Setup ==="
echo ""
echo "Please provide your Supabase credentials:"
echo ""
read -p "Enter your Supabase Project URL (e.g., https://abcdefgh.supabase.co): " SUPABASE_URL
read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY

# Create the new .env.local file
cat > .env.local << EOL
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
RESEND_API_KEY=re_K5hWhmsN_HLDuRyQR8mw8GFnTyY8NnCzB
EOL

echo ""
echo "✅ Environment file updated successfully!"
echo "🚀 You can now restart your server with: npm run dev" 