import { Router } from 'express';
import multer from 'multer';
import { uploadMetadata, uploadImage } from '../services/metadata.js';

const uploadRouter = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * POST /api/upload/image
 * Upload an image and return the URL (IPFS or other storage)
 */
uploadRouter.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Upload to Pinata IPFS
    const ipfsUrl = await uploadImage(req.file.buffer, req.file.mimetype);

    res.json({
      imageUrl: ipfsUrl, // Returns ipfs://<hash>
      message: 'Image uploaded successfully to IPFS',
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      error: 'Failed to upload image',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { uploadRouter };

