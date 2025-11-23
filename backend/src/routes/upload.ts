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

// Profile picture upload (max 5MB, square recommended)
const profilePictureUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile pictures
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

/**
 * POST /api/upload/profile-picture
 * Upload a profile picture and return the IPFS URL
 */
uploadRouter.post('/profile-picture', profilePictureUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Validate file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Profile picture must be 5MB or less' });
    }

    // Upload to Pinata IPFS
    const ipfsUrl = await uploadImage(req.file.buffer, req.file.mimetype);

    res.json({
      imageUrl: ipfsUrl, // Returns ipfs://<hash>
      message: 'Profile picture uploaded successfully to IPFS',
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({
      error: 'Failed to upload profile picture',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/upload/media
 * Upload multiple images for post embeds
 */
uploadRouter.post('/media', upload.array('images', 4), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    if (files.length > 4) {
      return res.status(400).json({ error: 'Maximum 4 images allowed per post' });
    }

    // Validate each file
    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'Only image files are allowed' });
      }
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ error: `Image ${file.originalname} exceeds 10MB limit` });
      }
    }

    // Upload all images to Pinata
    const uploadPromises = files.map(file =>
      uploadImage(file.buffer, file.mimetype)
    );

    const ipfsUrls = await Promise.all(uploadPromises);

    res.json({
      imageUrls: ipfsUrls, // Returns array of ipfs://hash
      message: `${files.length} image(s) uploaded successfully to IPFS`,
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({
      error: 'Failed to upload media',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { uploadRouter };

