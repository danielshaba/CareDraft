#!/bin/bash

echo "🔧 Starting comprehensive linting fixes..."

# Fix common any types
echo "Fixing 'any' types..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs sed -i '' 's/: any/: unknown/g'
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs sed -i '' 's/Record<string, any>/Record<string, unknown>/g'
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs sed -i '' 's/Array<any>/Array<unknown>/g'
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs sed -i '' 's/any\[\]/unknown[]/g'

# Fix JSX escaping issues
echo "Fixing JSX escaping..."
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Don't/Don\&apos;t/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/We've/We\&apos;ve/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/You've/You\&apos;ve/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/I've/I\&apos;ve/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/They've/They\&apos;ve/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/It's/It\&apos;s/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/That's/That\&apos;s/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/What's/What\&apos;s/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Here's/Here\&apos;s/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/There's/There\&apos;s/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Let's/Let\&apos;s/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Can't/Can\&apos;t/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Won't/Won\&apos;t/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Didn't/Didn\&apos;t/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Doesn't/Doesn\&apos;t/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Isn't/Isn\&apos;t/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Aren't/Aren\&apos;t/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Wasn't/Wasn\&apos;t/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Weren't/Weren\&apos;t/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Haven't/Haven\&apos;t/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Hasn't/Hasn\&apos;t/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Shouldn't/Shouldn\&apos;t/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Wouldn't/Wouldn\&apos;t/g"
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' "s/Couldn't/Couldn\&apos;t/g"

# Fix quote escaping
find . -name "*.tsx" | grep -v node_modules | xargs sed -i '' 's/"/\&quot;/g'

# Fix unused catch variables
echo "Fixing unused catch variables..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs sed -i '' 's/} catch (error) {/} catch {/g'
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs sed -i '' 's/} catch (e) {/} catch {/g'
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs sed -i '' 's/} catch (err) {/} catch {/g'
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs sed -i '' 's/} catch (parseError) {/} catch {/g'

# Fix unused function parameters by prefixing with underscore
echo "Fixing unused parameters..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs sed -i '' 's/function.*(\([^)]*\)request: NextRequest/function.*(\1_request: NextRequest/g'

echo "✅ Linting fixes completed!"
echo "Running linter to check remaining issues..."
npm run lint 2>&1 | grep -E "Error:" | wc -l 