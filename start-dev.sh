#!/bin/bash

# CareDraft Development Server Startup Script

echo "🚀 Starting CareDraft Development Server..."
echo "=========================================="

# Check if caredraft directory exists
if [ ! -d "caredraft" ]; then
    echo "❌ Error: caredraft directory not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check if .env.local exists
if [ ! -f "caredraft/.env.local" ]; then
    echo "⚠️  Warning: caredraft/.env.local not found!"
    echo "Running Supabase setup..."
    npm run setup:supabase
fi

echo ""
echo "🔍 Checking configuration..."

# Test Supabase connection
npm run test:supabase

echo ""
echo "🏃 Starting development server..."
echo "The application will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server
cd caredraft && npm run dev 