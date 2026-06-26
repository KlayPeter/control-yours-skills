const sharp = require('sharp');
const fs = require('fs');

async function resizeIcon() {
  const original = 'build/icon.png';
  const temp = 'build/icon_temp.png';
  
  // Current icon is 512x512, with a 436x436 squircle inside (padding 38)
  // Let's extract the 436x436 core, resize to 480x480, and pad to 512x512 (padding 16)
  await sharp(original)
    .extract({ left: 38, top: 38, width: 436, height: 436 })
    .resize(480, 480, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 16,
      bottom: 16,
      left: 16,
      right: 16,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFile(temp);
    
  fs.renameSync(temp, original);
  console.log('Icon resized to 480px successfully!');
}

resizeIcon().catch(console.error);
