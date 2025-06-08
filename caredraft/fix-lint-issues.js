#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Helper function to read and write files
const fixFile = (filePath, fixes) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    fixes.forEach(fix => {
      const newContent = content.replace(fix.search, fix.replace);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`✓ Fixed: ${fix.description} in ${filePath}`);
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
};

// Fix unused imports and variables
const fixUnusedImports = () => {
  console.log('🔧 Fixing unused imports and variables...');
  
  // Knowledge Hub Page - remove unused imports
  fixFile('app/(dashboard)/knowledge-hub/page.tsx', [
    {
      search: /import { SearchBar } from '@\/components\/knowledge-hub\/SearchBar'\n/g,
      replace: '',
      description: 'Remove unused SearchBar import'
    },
    {
      search: /import { SearchFilters } from '@\/components\/knowledge-hub\/SearchFilters'\n/g,
      replace: '',
      description: 'Remove unused SearchFilters import'
    }
  ]);
  
  // Admin Organizations - remove unused import
  fixFile('app/(dashboard)/admin/organizations/page.tsx', [
    {
      search: /, ArrowLeft/g,
      replace: '',
      description: 'Remove unused ArrowLeft import'
    }
  ]);
  
  // Compliance page - remove unused imports  
  fixFile('app/(dashboard)/tender-details/compliance/page.tsx', [
    {
      search: /import type { Metadata } from 'next'\n/g,
      replace: '',
      description: 'Remove unused Metadata import'
    },
    {
      search: /, Download, Settings/g,
      replace: '',
      description: 'Remove unused Download and Settings imports'
    }
  ]);
};

// Fix JSX escaping issues
const fixJSXEscaping = () => {
  console.log('🔧 Fixing JSX escaping issues...');
  
  // Settings users page
  fixFile('app/(dashboard)/settings/users/page.tsx', [
    {
      search: /Can't find what you're looking for\?/g,
      replace: "Can&apos;t find what you&apos;re looking for?",
      description: 'Escape apostrophes in JSX'
    }
  ]);
};

// Fix any types to unknown
const fixAnyTypes = () => {
  console.log('🔧 Fixing any types to unknown/specific types...');
  
  // Extract page
  fixFile('app/(dashboard)/extract/page.tsx', [
    {
      search: /Record<string, any\[\]>/g,
      replace: 'Record<string, unknown[]>',
      description: 'Replace any[] with unknown[]'
    }
  ]);
  
  // Notifications realtime test
  fixFile('app/(dashboard)/notifications/realtime-test/page.tsx', [
    {
      search: /: any\) =>/g,
      replace: ': unknown) =>',
      description: 'Replace any parameter with unknown'
    }
  ]);
  
  // Notifications trigger test
  fixFile('app/(dashboard)/notifications/trigger-test/page.tsx', [
    {
      search: /: any/g,
      replace: ': unknown',
      description: 'Replace any type with unknown'
    }
  ]);
  
  // API routes
  fixFile('app/api/admin/audit-logs/route.ts', [
    {
      search: /: any/g,
      replace: ': unknown',
      description: 'Replace any type with unknown'
    }
  ]);
  
  fixFile('app/api/ai/brainstorm/route.ts', [
    {
      search: /: any/g,
      replace: ': unknown',
      description: 'Replace any type with unknown'
    }
  ]);
};

// Remove unused variables
const fixUnusedVariables = () => {
  console.log('🔧 Fixing unused variables...');
  
  // Realtime notifications test
  fixFile('app/(dashboard)/notifications/realtime-test/page.tsx', [
    {
      search: /const \[isManualMode, setIsManualMode\] = useState\(false\)\n/g,
      replace: '// Manual mode state removed as unused\n',
      description: 'Remove unused isManualMode state'
    }
  ]);
  
  // Compliance page
  fixFile('app/(dashboard)/tender-details/compliance/page.tsx', [
    {
      search: /const \[extractedText, setExtractedText\] = useState<string\|null>\(null\)\n/g,
      replace: '// extractedText state removed as unused\n',
      description: 'Remove unused extractedText state'
    },
    {
      search: /const \[sourceDocumentId, setSourceDocumentId\] = useState<string\|null>\(null\)\n/g,
      replace: '// sourceDocumentId state removed as unused\n',
      description: 'Remove unused sourceDocumentId state'
    }
  ]);
};

// Fix unused interface definitions
const fixUnusedInterfaces = () => {
  console.log('🔧 Fixing unused interfaces...');
  
  // AI Brainstorm route
  fixFile('app/api/ai/brainstorm/route.ts', [
    {
      search: /interface BrainstormRequest \{[\s\S]*?\}\n\n/g,
      replace: '// BrainstormRequest interface removed as unused\n\n',
      description: 'Remove unused BrainstormRequest interface'
    }
  ]);
  
  // AI Extract route
  fixFile('app/api/ai/extract/route.ts', [
    {
      search: /interface ExtractRequest \{[\s\S]*?\}\n\n/g,
      replace: '// ExtractRequest interface removed as unused\n\n',
      description: 'Remove unused ExtractRequest interface'
    }
  ]);
};

// Main execution
console.log('🚀 Starting comprehensive lint fixes...\n');

fixUnusedImports();
fixJSXEscaping();
fixAnyTypes();
fixUnusedVariables();
fixUnusedInterfaces();

console.log('\n✅ All lint fixes completed!');
console.log('🔍 Run npm run lint to verify fixes...'); 