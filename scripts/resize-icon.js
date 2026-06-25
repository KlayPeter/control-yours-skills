const sharp = require('sharp');
const fs = require('fs');

async function resizeIcon() {
  const original = 'build/icon.png';
  const temp = 'build/icon_temp.png';
  
  // Create a transparent 512x512 background and composite the resized icon (80% of 512 = 410) onto it.
  await sharp(original)
    .resize(410, 410, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFile(temp);
    
  fs.renameSync(temp, original);
  console.log('Icon padded with transparency successfully!');
}

resizeIcon().catch(console.error);
