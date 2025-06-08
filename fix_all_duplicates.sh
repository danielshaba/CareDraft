#!/bin/bash

echo "🔧 Fixing all duplicate function exports..."

# Fix RAG documents route
echo "Fixing app/api/rag/documents/route.ts..."
sed -i '' '44s/export async function GET() {/export async function POST(request: NextRequest) {/' app/api/rag/documents/route.ts
sed -i '' 's/import { NextResponse } from '\''next\/server'\''/import { NextRequest, NextResponse } from '\''next\/server'\''/' app/api/rag/documents/route.ts

# Fix RAG query-pipeline route
echo "Fixing app/api/rag/query-pipeline/route.ts..."
sed -i '' '99s/export async function GET() {/export async function POST(request: NextRequest) {/' app/api/rag/query-pipeline/route.ts
sed -i '' 's/import { NextResponse } from '\''next\/server'\''/import { NextRequest, NextResponse } from '\''next\/server'\''/' app/api/rag/query-pipeline/route.ts

# Fix RAG upload route
echo "Fixing app/api/rag/upload/route.ts..."
sed -i '' '143s/export async function GET() {/export async function POST(request: NextRequest) {/' app/api/rag/upload/route.ts
sed -i '' 's/import { NextResponse } from '\''next\/server'\''/import { NextRequest, NextResponse } from '\''next\/server'\''/' app/api/rag/upload/route.ts

# Fix test-email route
echo "Fixing app/api/test-email/route.ts..."
sed -i '' '105s/export async function GET() {/export async function POST(request: NextRequest) {/' app/api/test-email/route.ts
sed -i '' 's/import { NextResponse } from '\''next\/server'\''/import { NextRequest, NextResponse } from '\''next\/server'\''/' app/api/test-email/route.ts

# Fix research-sessions route
echo "Fixing app/api/research-sessions/route.ts..."
sed -i '' '63s/export async function GET() {/export async function POST(request: NextRequest) {/' app/api/research-sessions/route.ts
sed -i '' 's/import { NextResponse } from '\''next\/server'\''/import { NextRequest, NextResponse } from '\''next\/server'\''/' app/api/research-sessions/route.ts

# Fix research-sessions/[id] route
echo "Fixing app/api/research-sessions/[id]/route.ts..."
# This one has multiple GET functions, need to be more careful
grep -n "export async function GET" app/api/research-sessions/[id]/route.ts | head -1 | cut -d: -f1 | xargs -I {} sed -i '' '{}s/export async function GET(_: NextRequest, { params }: { params: Params }) {/export async function POST(request: NextRequest, { params }: { params: Params }) {/' app/api/research-sessions/[id]/route.ts
sed -i '' 's/import { NextResponse } from '\''next\/server'\''/import { NextRequest, NextResponse } from '\''next\/server'\''/' app/api/research-sessions/[id]/route.ts

# Fix research-sessions/[id]/share route
echo "Fixing app/api/research-sessions/[id]/share/route.ts..."
grep -n "export async function GET" app/api/research-sessions/[id]/share/route.ts | head -1 | cut -d: -f1 | xargs -I {} sed -i '' '{}s/export async function GET(_: NextRequest, { params }: { params: Params }) {/export async function POST(request: NextRequest, { params }: { params: Params }) {/' app/api/research-sessions/[id]/share/route.ts
sed -i '' 's/import { NextResponse } from '\''next\/server'\''/import { NextRequest, NextResponse } from '\''next\/server'\''/' app/api/research-sessions/[id]/share/route.ts

# Fix admin/audit-logs route
echo "Fixing app/api/admin/audit-logs/route.ts..."
sed -i '' '125s/export async function POST(request: NextRequest) {/export async function POST(request: NextRequest) {/' app/api/admin/audit-logs/route.ts

echo "✅ All duplicate exports fixed!"
echo "🔍 Running build test..."
npm run build 2>&1 | grep -c "Module parse failed" || echo "No more parse errors!" 