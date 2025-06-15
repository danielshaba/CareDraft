#!/bin/bash

# Find all page.tsx files with 'use client' directive and add dynamic export if missing
find app -name "page.tsx" -exec grep -l "'use client'" {} \; | while read file; do
  if ! grep -q "export const dynamic" "$file"; then
    echo -e "\n// Disable static generation for this page since it has client-side functionality\nexport const dynamic = 'force-dynamic'" >> "$file"
    echo "Added dynamic export to: $file"
  else
    echo "Dynamic export already exists in: $file"
  fi
done

echo "Finished adding dynamic exports to client component pages" 