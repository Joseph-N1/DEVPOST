/\*\*

- Icon Generation Instructions - Phase 9
-
- This file contains instructions for generating PWA icons.
- You'll need to create 8 icon sizes for the app.
-
- OPTION 1: Use an online tool
- ***
- 1.  Visit: https://realfavicongenerator.net/
- 2.  Upload your logo/icon (should be at least 512x512px)
- 3.  Configure:
- - App Name: ECO FARM
- - Background Color: #16a34a (green)
- - Theme Color: #16a34a
- 4.  Download the generated icons
- 5.  Place them in /frontend/public/icons/
-
- OPTION 2: Use ImageMagick (Command Line)
- ***
- If you have a source image (logo.png), use these commands:
-
- magick logo.png -resize 72x72 icon-72.png
- magick logo.png -resize 96x96 icon-96.png
- magick logo.png -resize 128x128 icon-128.png
- magick logo.png -resize 144x144 icon-144.png
- magick logo.png -resize 152x152 icon-152.png
- magick logo.png -resize 192x192 icon-192.png
- magick logo.png -resize 384x384 icon-384.png
- magick logo.png -resize 512x512 icon-512.png
-
- OPTION 3: Use Node.js script with sharp
- ***
- Install: npm install sharp
- Then create and run a script to resize your logo.
-
- REQUIRED ICON SIZES:
- ***
- - icon-72.png (72×72) - iOS, Android home screen
- - icon-96.png (96×96) - Android home screen
- - icon-128.png (128×128) - Chrome Web Store
- - icon-144.png (144×144) - Microsoft tiles
- - icon-152.png (152×152) - iOS home screen
- - icon-192.png (192×192) - Android splash screen
- - icon-384.png (384×384) - Android larger devices
- - icon-512.png (512×512) - Android splash screen, app stores
-
- DESIGN GUIDELINES:
- ***
- - Use a square logo/icon
- - Background: #16a34a (green) or transparent
- - Include farm/poultry imagery (chicken, barn, farm elements)
- - Keep it simple and recognizable at small sizes
- - Ensure good contrast for visibility
- - Use white or light colors for icon elements
-
- PLACEHOLDER CREATION (TEMPORARY):
- ***
- For testing, you can create solid color placeholders:
- 1.  Use any image editor (GIMP, Photoshop, Paint.NET, etc.)
- 2.  Create a 512×512 green (#16a34a) square
- 3.  Add white text "ECO FARM" or a simple chicken emoji
- 4.  Export as PNG
- 5.  Resize to all required sizes
-
- Once you have the icons, place them in:
- /frontend/public/icons/
-
- File structure should be:
- public/
- icons/
-     icon-72.png
-     icon-96.png
-     icon-128.png
-     icon-144.png
-     icon-152.png
-     icon-192.png
-     icon-384.png
-     icon-512.png
  \*/

// This is a documentation file only.
// No code execution required.

console.log('PWA Icons Generation Guide');
console.log('Please follow the instructions in this file to create app icons.');
console.log('Place the generated icons in: /frontend/public/icons/');
