import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

// Cloudinary config (you can skip this if already configured in config/cloudinary.js)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req: Express.Request, file: Express.Multer.File) => {
    const userId = req.user?.id || 'anonymous';

    if (file.mimetype.startsWith('image/')) {
      return {
        folder: `lms/courses/images/${userId}`,
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto' },
        ],
      };
    } else if (file.mimetype.startsWith('video/')) {
      return {
        folder: `lms/courses/videos/${userId}`,
        allowed_formats: ['mp4', 'avi', 'mov', 'mkv', 'webm'],
        resource_type: 'video',
        transformation: [{ quality: 'auto' }],
      };
    } else if (file.mimetype === 'application/pdf') {
      return {
        folder: `lms/courses/documents/${userId}`,
        allowed_formats: ['pdf'],
        resource_type: 'auto',
      };
    }

    return {
      folder: `lms/courses/other/${userId}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mov', 'pdf'],
    };
  },
});

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images, videos, and PDFs
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and PDFs are allowed.'));
  }
};

// Multer configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Separate uploads for different purposes
export const uploadImage = upload.single('image');
export const uploadVideo = upload.single('video');
export const uploadDocument = upload.single('document');

// Multiple file uploads for course creation
export const uploadCourseFiles = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'document', maxCount: 5 }
]);

// Multiple file uploads for lesson creation
export const uploadLessonFiles = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'document', maxCount: 3 }
]);

// Error handling middleware for multer
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 100MB.'
      });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: error.message
    });
  }

  next(error);
};