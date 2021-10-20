const multer = require('multer');

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg'
}

const AUDIO_MIME_TYPE_MAP = {
  'audio/wav': 'wav',
  'audio/mp4': 'mp4',
  'audio/mpeg': 'mpeg',
  'audio/mpeg-3': 'mpeg',
  'audio/basic': 'basic',
  'audio/wav': 'wav',
  'audio/vnd.wav': 'vnd.wav',
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValidImage = MIME_TYPE_MAP[file.mimetype];
    const isValidAudio = AUDIO_MIME_TYPE_MAP[file.mimetype];

    console.log("MIMETYPE", file.mimetype, file.path, file.fieldname)
    let error = new Error('Invalid mime type');

    if (isValidImage || isValidAudio) {
      error = null;
    }

    if (file.fieldname === 'ImageUpload')
      cb(error, "images");
  },

  filename: (req, file, cb) => {
    const name = file.originalname.toLowerCase().split(' ').join('-');
    const ext = MIME_TYPE_MAP[file.mimetype];
    cb(null, name + '-' + Date.now() + '.' + ext);
  }
});


module.exports = multer({ storage: storage }).single("ImageUpload");