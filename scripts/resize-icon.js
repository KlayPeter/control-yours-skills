const sharp = require('sharp');
const fs = require('fs');

async function resizeIcon() {
  const original = 'build/icon.png';
  const temp = 'build/icon_temp.png';
  
  await sharp(original)
    .extract({ left: 26, top: 26, width: 460, height: 460 })
    .resize(436, 436, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 38,
      bottom: 38,
      left: 38,
      right: 38,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFile(temp);
    
  fs.renameSync(temp, original);
  console.log('Icon resized to 436 (85%) successfully!');
}

resizeIcon().catch(console.error);
