const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes needed for various purposes
const iconSizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'icon-48x48.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

async function generateIcons() {
  const svgPath = path.join(__dirname, '../public/caredraft-icon.svg');
  const outputDir = path.join(__dirname, '../public');
  
  console.log('🎨 Generating CareDraft icons...');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate PNG icons
  for (const { size, name } of iconSizes) {
    try {
      const outputPath = path.join(outputDir, name);
      
      await sharp(svgPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png({
          quality: 100,
          compressionLevel: 9
        })
        .toFile(outputPath);
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Error generating ${name}:`, error.message);
    }
  }
  
  // Generate favicon.ico (multi-size ICO file)
  try {
    const icoSizes = [16, 32, 48];
    const icoPath = path.join(outputDir, 'favicon.ico');
    
    // Generate the largest size first
    const png32 = await sharp(svgPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toBuffer();
    
    // For now, just use the 32x32 as favicon.ico
    // In production, you might want to use a proper ICO generator
    fs.writeFileSync(icoPath, png32);
    console.log('✅ Generated favicon.ico');
  } catch (error) {
    console.error('❌ Error generating favicon.ico:', error.message);
  }
  
  console.log('🎉 Icon generation complete!');
}

// Run the script
generateIcons().catch(console.error); 