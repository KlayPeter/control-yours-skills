const sharp = require('sharp');
const fs = require('fs');

async function resizeIcon() {
  const original = 'build/icon.png';
  const temp = 'build/icon_temp.png';
  
  await sharp(original)
    .extract({ left: 51, top: 51, width: 410, height: 410 })
    .resize(460, 460, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 26,
      bottom: 26,
      left: 26,
      right: 26,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFile(temp);
    
  fs.renameSync(temp, original);
  console.log('Icon enlarged successfully!');
}

resizeIcon().catch(console.error);
