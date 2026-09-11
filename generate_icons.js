const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputImagePath = path.join(__dirname, 'assets', 'logo.png');
const outputDir = path.join(__dirname, 'assets', 'images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  try {
    const image = sharp(inputImagePath);
    
    // Icon (1024x1024)
    await image
      .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(outputDir, 'icon.png'));
    console.log('icon.png generated');

    // Adaptive Icon (1024x1024)
    await image
      .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(outputDir, 'adaptive-icon.png'));
    console.log('adaptive-icon.png generated');

    // Splash Icon (Wait, usually splash is 1284x2778 or similar, but expo app.json just needs splash.png which is resized)
    await image
      .resize(1284, 2778, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(outputDir, 'splash.png'));
    console.log('splash.png generated');

    // Favicon (48x48)
    await image
      .resize(48, 48, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(outputDir, 'favicon.png'));
    console.log('favicon.png generated');

  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
