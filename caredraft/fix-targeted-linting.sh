#!/bin/bash

echo "🎯 Fixing targeted linting issues..."

# Fix unused error variables in catch blocks
echo "📝 Fixing unused error variables in catch blocks..."
find app -name "*.ts" -exec grep -l "'error' is defined but never used" {} \; | while read file; do
  echo "  Fixing unused error in $file"
  sed -i '' 's/} catch (error) {/} catch {/' "$file"
done

# Fix unused variables by prefixing with underscore
echo "📝 Fixing unused variables..."
find app -name "*.ts" -exec grep -l "is assigned a value but never used" {} \; | while read file; do
  echo "  Fixing unused variables in $file"
  sed -i '' 's/const supabase = /const _supabase = /' "$file"
  sed -i '' 's/const user_id = /const _user_id = /' "$file"
  sed -i '' 's/const action = /const _action = /' "$file"
  sed -i '' 's/const documentProcessor = /const _documentProcessor = /' "$file"
done

# Fix unused imports by removing them
echo "📝 Fixing unused imports..."
find app -name "*.ts" -exec grep -l "'.*' is defined but never used" {} \; | while read file; do
  echo "  Checking unused imports in $file"
  # Remove unused type imports
  sed -i '' 's/, AnswerBank//' "$file"
  sed -i '' 's/, AnswerBankSearchFilters//' "$file"
  sed -i '' 's/, CreateAnswerRequest//' "$file"
  sed -i '' 's/, ListAnswersRequest//' "$file"
  sed -i '' 's/, NotFoundError//' "$file"
  sed -i '' 's/, documentProcessor//' "$file"
  # Remove unused parameter names
  sed -i '' 's/(_: NextRequest)/()/g' "$file"
  sed -i '' 's/(_request: NextRequest)/()/g' "$file"
done

# Fix remaining NextRequest imports that are still unused
echo "📝 Fixing remaining NextRequest imports..."
find app -name "*.ts" -exec grep -l "'NextRequest' is defined but never used" {} \; | while read file; do
  echo "  Removing NextRequest import from $file"
  sed -i '' 's/import { NextRequest, NextResponse }/import { NextResponse }/' "$file"
  sed -i '' 's/import { NextResponse, NextRequest }/import { NextResponse }/' "$file"
  sed -i '' 's/, NextRequest//' "$file"
  sed -i '' 's/NextRequest, //' "$file"
done

echo "✅ Targeted linting fixes completed!"

# Check remaining error count
echo "🔍 Checking remaining error count..."
npm run lint 2>&1 | grep -E "(Error|Warning)" | wc -l 