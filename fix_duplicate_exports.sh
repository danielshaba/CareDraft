#!/bin/bash

echo "🔧 Fixing duplicate function exports in API routes..."

# List of files with duplicate exports (based on our findings)
FILES=(
  "app/api/organizations/route.ts"
  "app/api/research-sessions/route.ts"
  "app/api/research-sessions/[id]/route.ts"
  "app/api/research-sessions/[id]/share/route.ts"
  "app/api/answers/autocomplete/route.ts"
  "app/api/admin/audit-logs/route.ts"
  "app/api/admin/users/lifecycle/route.ts"
  "app/api/rag/documents/route.ts"
  "app/api/rag/query-pipeline/route.ts"
  "app/api/rag/upload/route.ts"
  "app/api/test-email/route.ts"
  "app/api/ai/rewrite/route.ts"
  "app/api/ai/brainstorm/route.ts"
  "app/api/ai/summarize/route.ts"
  "app/api/cron/deadline-processor/route.ts"
  "app/api/invitations/accept/route.ts"
  "app/api/invitations/route.ts"
)

for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    echo "Processing $file..."
    
    # Remove duplicate function exports - keep only the first occurrence
    # This uses awk to process the file and remove duplicate function declarations
    awk '
    /^export async function (GET|POST|PUT|PATCH|DELETE)/ {
      func = $3
      gsub(/\(.*/, "", func)  # Remove parameters from function name
      if (func in seen) {
        # Found duplicate, skip lines until we find the next function or end of function
        skip = 1
        brace_count = 0
        next
      }
      seen[func] = 1
    }
    
    skip && /\{/ { brace_count++ }
    skip && /\}/ { 
      brace_count--
      if (brace_count <= 0) {
        skip = 0
        next
      }
    }
    
    !skip { print }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    
    echo "✅ Fixed $file"
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "🎉 Done fixing duplicate exports!" 