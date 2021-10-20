const multer = require('multer');
const fs = require('fs');

const MIME_TYPE_MAP = {
  'audio/wav': 'wav',
  'audio/mp4': 'mp4',
  'audio/mpeg': 'mpeg',
  'audio/mpeg-3': 'mpeg',
  'audio/webm': 'webm',
  'audio/basic': 'basic',
  'audio/wav': 'wav',
  'audio/vnd.wav': 'vnd.wav',
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error('Invalid mime type');
    if (isValid) {
      error = null;
      // fs.writeFileSync('chataudio', file.buffer)
    }
    cb(error, "chataudio");
  },
  filename: (req, file, cb) => {
    console.log(file?.duration)
    const name = file.originalname.toLowerCase().split(' ').join('-');
    const ext = MIME_TYPE_MAP[file.mimetype];
    cb(null, name + '-' + Date.now() + '.' + ext);
  }
});


module.exports = multer({storage: storage }).single("AudioUpload");