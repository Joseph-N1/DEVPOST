/**
 * PWA Icon Generator Script
 * Generates placeholder icons for ECO FARM PWA
 * 
 * Usage: node scripts/generate_icons.js
 * 
 * Requires: sharp package
 * Install: npm install sharp
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available (try frontend node_modules first)
let sharp;
try {
    // Try to load from frontend node_modules
    sharp = require('../frontend/node_modules/sharp');
} catch (error1) {
    try {
        // Fallback to global sharp
        sharp = require('sharp');
    } catch (error2) {
        console.error('❌ Error: sharp package not found.');
        console.error('Please install sharp in frontend: cd frontend && npm install sharp');
        console.error('Or install globally: npm install sharp');
        process.exit(1);
    }
}

// Configuration
const ICONS_DIR = path.join(__dirname, '..', 'frontend', 'public', 'icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const BACKGROUND_COLOR = '#16a34a'; // Green
const TEXT_COLOR = '#ffffff'; // White

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
    console.log(`✅ Created directory: ${ICONS_DIR}`);
}

/**
 * Generate SVG icon with farm/chicken theme
 */
function generateSVG(size) {
    const fontSize = Math.floor(size * 0.15);
    const iconSize = Math.floor(size * 0.5);
    const iconY = Math.floor(size * 0.35);
    const textY = Math.floor(size * 0.75);
    
    return `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <!-- Background -->
            <rect width="${size}" height="${size}" fill="${BACKGROUND_COLOR}"/>
            
            <!-- Simple farm/chicken icon -->
            <g transform="translate(${size/2}, ${iconY})">
                <!-- Chicken body (simplified) -->
                <circle cx="0" cy="0" r="${iconSize * 0.3}" fill="${TEXT_COLOR}"/>
                <!-- Chicken head -->
                <circle cx="${iconSize * 0.15}" cy="${-iconSize * 0.25}" r="${iconSize * 0.2}" fill="${TEXT_COLOR}"/>
                <!-- Beak -->
                <polygon points="${iconSize * 0.25},${-iconSize * 0.25} ${iconSize * 0.4},${-iconSize * 0.25} ${iconSize * 0.33},${-iconSize * 0.2}" fill="#FFA500"/>
                <!-- Eye -->
                <circle cx="${iconSize * 0.2}" cy="${-iconSize * 0.3}" r="${iconSize * 0.04}" fill="#000000"/>
                <!-- Comb -->
                <path d="M ${iconSize * 0.1},${-iconSize * 0.4} Q ${iconSize * 0.15},${-iconSize * 0.5} ${iconSize * 0.2},${-iconSize * 0.4}" 
                      fill="#FF0000" stroke="none"/>
            </g>
            
            <!-- App name -->
            <text 
                x="${size/2}" 
                y="${textY}" 
                font-family="Arial, sans-serif" 
                font-size="${fontSize}" 
                font-weight="bold" 
                fill="${TEXT_COLOR}" 
                text-anchor="middle">
                ECO FARM
            </text>
        </svg>
    `;
}

/**
 * Generate all icon sizes
 */
async function generateIcons() {
    console.log('🎨 Starting PWA icon generation...\n');
    
    for (const size of SIZES) {
        try {
            const svgContent = generateSVG(size);
            const outputPath = path.join(ICONS_DIR, `icon-${size}.png`);
            
            // Convert SVG to PNG using sharp
            await sharp(Buffer.from(svgContent))
                .png()
                .toFile(outputPath);
            
            console.log(`✅ Generated icon-${size}.png (${size}×${size})`);
        } catch (error) {
            console.error(`❌ Failed to generate icon-${size}.png:`, error.message);
        }
    }
    
    console.log('\n🎉 Icon generation complete!');
    console.log(`📁 Icons saved to: ${ICONS_DIR}`);
    console.log('\n📋 Next steps:');
    console.log('   1. Verify icons in /frontend/public/icons/');
    console.log('   2. Test PWA installation on mobile device');
    console.log('   3. (Optional) Replace with custom designed icons');
}

// Run the generator
generateIcons().catch(error => {
    console.error('❌ Icon generation failed:', error);
    process.exit(1);
});
