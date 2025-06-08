#!/bin/bash

echo "🔧 Fixing remaining linting issues..."

# Fix unused NextRequest imports in API routes that don't use request parameter
echo "📝 Fixing unused NextRequest imports..."

# Files that have GET functions without request parameter
files_with_unused_nextrequest=(
  "app/api/ai/brainstorm/route.ts"
  "app/api/ai/embeddings/route.ts" 
  "app/api/ai/rewrite/route.ts"
  "app/api/ai/summarize/route.ts"
  "app/api/analytics/performance/route.ts"
  "app/api/cron/deadline-processor/route.ts"
  "app/api/invitations/accept/route.ts"
  "app/api/invitations/route.ts"
  "app/api/organizations/route.ts"
  "app/api/organizations/switch/route.ts"
)

for file in "${files_with_unused_nextrequest[@]}"; do
  if [[ -f "$file" ]]; then
    echo "  Fixing $file..."
    # Remove NextRequest from import if it's not used in function parameters
    sed -i '' 's/import { NextRequest, NextResponse }/import { NextResponse }/' "$file"
    sed -i '' 's/import { NextResponse, NextRequest }/import { NextResponse }/' "$file"
    sed -i '' 's/, NextRequest//' "$file"
    sed -i '' 's/NextRequest, //' "$file"
  fi
done

# Fix catch blocks without error parameters
echo "📝 Fixing catch blocks without error parameters..."

# Find and fix catch blocks that reference error but don't capture it
find app -name "*.ts" -type f -exec grep -l "} catch {" {} \; | while read file; do
  echo "  Fixing catch blocks in $file..."
  # Add error parameter to catch blocks that reference error
  if grep -q "console.error.*error" "$file"; then
    sed -i '' 's/} catch {/} catch (error) {/' "$file"
  fi
done

# Fix specific unused variables
echo "📝 Fixing unused variables..."

# Fix unused supabase variables
find app -name "*.ts" -type f -exec grep -l "'supabase' is assigned a value but never used" {} \; 2>/dev/null | while read file; do
  echo "  Fixing unused supabase in $file..."
  # Comment out or prefix with underscore
  sed -i '' 's/const supabase = /const _supabase = /' "$file"
  sed -i '' 's/= supabase/= _supabase/' "$file"
done

# Fix unused error variables in catch blocks
find app -name "*.ts" -type f -exec grep -l "} catch (.*Error)" {} \; | while read file; do
  echo "  Fixing unused error variables in $file..."
  # Replace specific error variable names with underscore
  sed -i '' 's/} catch (parseError)/} catch (_parseError)/' "$file"
  sed -i '' 's/} catch (validationError)/} catch (_validationError)/' "$file"
  sed -i '' 's/} catch (authError)/} catch (_authError)/' "$file"
done

# Fix unused imports
echo "📝 Fixing unused imports..."

# Remove unused NotFoundError import
find app -name "*.ts" -type f -exec grep -l "'NotFoundError' is defined but never used" {} \; | while read file; do
  echo "  Removing unused NotFoundError import in $file..."
  sed -i '' 's/, NotFoundError//' "$file"
  sed -i '' 's/NotFoundError, //' "$file"
  sed -i '' '/^import.*NotFoundError.*$/d' "$file"
done

# Fix malformed function declarations that might have been missed
echo "📝 Fixing any remaining malformed function declarations..."

find app lib -name "*.ts" -type f -exec grep -l "function\.\*" {} \; | while read file; do
  echo "  Fixing malformed functions in $file..."
  # This should catch any remaining malformed function declarations
  sed -i '' 's/function\.\*(/function handleRequest(/' "$file"
done

# Fix JSX escaping issues that might remain
echo "📝 Fixing remaining JSX escaping issues..."

find app -name "*.tsx" -type f -exec grep -l "'" {} \; | while read file; do
  echo "  Checking JSX escaping in $file..."
  # Fix common apostrophe patterns in JSX
  sed -i '' "s/Don't/Don\&apos;t/g" "$file"
  sed -i '' "s/We've/We\&apos;ve/g" "$file"
  sed -i '' "s/You're/You\&apos;re/g" "$file"
  sed -i '' "s/It's/It\&apos;s/g" "$file"
  sed -i '' "s/Can't/Can\&apos;t/g" "$file"
  sed -i '' "s/Won't/Won\&apos;t/g" "$file"
  sed -i '' "s/Didn't/Didn\&apos;t/g" "$file"
  sed -i '' "s/Couldn't/Couldn\&apos;t/g" "$file"
  sed -i '' "s/Shouldn't/Shouldn\&apos;t/g" "$file"
  sed -i '' "s/Wouldn't/Wouldn\&apos;t/g" "$file"
done

# Fix any remaining 'any' types that weren't caught
echo "📝 Fixing remaining 'any' types..."

find app lib -name "*.ts" -name "*.tsx" -type f -exec grep -l ": any" {} \; | while read file; do
  echo "  Fixing any types in $file..."
  # Replace common any patterns with unknown
  sed -i '' 's/: any\[\]/: unknown[]/' "$file"
  sed -i '' 's/: any)/: unknown)/' "$file"
  sed -i '' 's/: any,/: unknown,/' "$file"
  sed -i '' 's/: any;/: unknown;/' "$file"
  sed -i '' 's/: any =/: unknown =/' "$file"
done

echo "✅ Remaining linting fixes completed!"
echo "🔍 Running lint check to see remaining issues..."

npm run lint 2>&1 | head -20 