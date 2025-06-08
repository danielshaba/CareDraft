#!/bin/bash

echo "🔧 Comprehensive linting fixes..."

# Fix unused error variables in catch blocks by removing the parameter
echo "📝 Fixing unused error variables in catch blocks..."
find app -name "*.ts" -exec grep -l "'error' is defined but never used" {} \; | while read file; do
  echo "  Fixing $file"
  sed -i '' 's/} catch (error) {/} catch {/' "$file"
done

# Fix unused variables by prefixing with underscore
echo "📝 Fixing unused variables..."
find app components lib -name "*.ts" -name "*.tsx" -exec grep -l "is assigned a value but never used" {} \; | while read file; do
  echo "  Fixing unused variables in $file"
  # Common unused variables
  sed -i '' 's/const supabase = /const _supabase = /' "$file"
  sed -i '' 's/const user_id = /const _user_id = /' "$file"
  sed -i '' 's/const action = /const _action = /' "$file"
  sed -i '' 's/const result = /const _result = /' "$file"
  sed -i '' 's/const documentProcessor = /const _documentProcessor = /' "$file"
  sed -i '' 's/const deadlineRules = /const _deadlineRules = /' "$file"
  sed -i '' 's/const addTag = /const _addTag = /' "$file"
done

# Fix unused type imports
echo "📝 Fixing unused type imports..."
find app components lib -name "*.ts" -name "*.tsx" -exec grep -l "is defined but never used" {} \; | while read file; do
  echo "  Fixing unused imports in $file"
  
  # Remove unused imports from import statements
  sed -i '' 's/, AnswerBank//' "$file"
  sed -i '' 's/, AnswerBankSearchFilters//' "$file"
  sed -i '' 's/, CreateAnswerRequest//' "$file"
  sed -i '' 's/, ListAnswersRequest//' "$file"
  sed -i '' 's/, NotFoundError//' "$file"
  sed -i '' 's/, documentProcessor//' "$file"
  sed -i '' 's/, NextResponse//' "$file"
  sed -i '' 's/, ExaMCPService//' "$file"
  sed -i '' 's/, SearchOptions//' "$file"
  sed -i '' 's/, validateExaAIConfig//' "$file"
  sed -i '' 's/, searchRateLimit//' "$file"
  sed -i '' 's/, createRateLimitHeaders//' "$file"
  sed -i '' 's/, createRateLimitErrorResponse//' "$file"
  sed -i '' 's/, getEnvironmentConfig//' "$file"
  sed -i '' 's/, generateETag//' "$file"
  sed -i '' 's/, validateSearchRequest//' "$file"
  sed -i '' 's/, FileBrowser//' "$file"
  sed -i '' 's/, Settings//' "$file"
  sed -i '' 's/, Badge//' "$file"
  sed -i '' 's/, CardTitle//' "$file"
  sed -i '' 's/, CardHeader//' "$file"
  sed -i '' 's/, User//' "$file"
  sed -i '' 's/, ResearchSession//' "$file"
  sed -i '' 's/, NotificationInsert//' "$file"
  
  # Remove from beginning of import statements
  sed -i '' 's/AnswerBank, //' "$file"
  sed -i '' 's/AnswerBankSearchFilters, //' "$file"
  sed -i '' 's/CreateAnswerRequest, //' "$file"
  sed -i '' 's/ListAnswersRequest, //' "$file"
  sed -i '' 's/NotFoundError, //' "$file"
  sed -i '' 's/NextResponse, //' "$file"
  sed -i '' 's/Badge, //' "$file"
  sed -i '' 's/CardTitle, //' "$file"
  sed -i '' 's/CardHeader, //' "$file"
  sed -i '' 's/User, //' "$file"
  sed -i '' 's/ResearchSession, //' "$file"
  sed -i '' 's/NotificationInsert, //' "$file"
done

# Fix unused parameters by replacing with underscore
echo "📝 Fixing unused parameters..."
find app components lib -name "*.ts" -name "*.tsx" -exec grep -l "'_' is defined but never used" {} \; | while read file; do
  echo "  Fixing unused parameters in $file"
  # Replace unused parameter patterns
  sed -i '' 's/(_: NextRequest)/()/' "$file"
  sed -i '' 's/(_request: NextRequest)/()/' "$file"
  sed -i '' 's/(_: unknown)/()/' "$file"
done

# Remove empty import statements that might have been created
echo "📝 Cleaning up empty imports..."
find app components lib -name "*.ts" -name "*.tsx" -exec grep -l "import { }" {} \; | while read file; do
  echo "  Removing empty import in $file"
  sed -i '' '/import { }/d' "$file"
done

echo "✅ Comprehensive linting fixes completed!"

# Check final error count
echo "🔍 Final error count:"
npm run lint 2>&1 | grep -E "(Error|Warning)" | wc -l 