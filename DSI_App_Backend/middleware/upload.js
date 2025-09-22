import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const imageType = file.fieldname; // 'houseImage', 'treeImage', or 'personImage'
    cb(null, `${Date.now()}-${imageType}-${file.originalname}`);
  }
});

// Update file filter to handle multiple images
const fileFilter = (req, file, cb) => {
  console.log('File received:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  // More flexible MIME type checking
  const allowedTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png',
    'image/pjpeg',  // Some systems use this
    'image/x-png'   // Some systems use this
  ];
  
  // Check if MIME type is allowed
  if (allowedTypes.includes(file.mimetype)) {
    console.log('File accepted:', file.fieldname);
    cb(null, true);
  } else {
    console.log('File rejected - Invalid MIME type:', file.mimetype, 'for field:', file.fieldname);
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`), false);
  }
};


export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});