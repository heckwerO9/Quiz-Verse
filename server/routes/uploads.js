const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const MAX_SIZE = 2 * 1024 * 1024;
const FORMAT = {
  'image/png': { ext: 'png' },
  'image/jpeg': { ext: 'jpg' },
  'image/gif': { ext: 'gif' },
  'image/webp': { ext: 'webp' }
};

function matchesMagic(buf, type) {
  if (type === 'image/png') return buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  if (type === 'image/jpeg') return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (type === 'image/gif') return buf.length > 4 && buf.toString('ascii', 0, 4) === 'GIF8';
  if (type === 'image/webp') return buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

// POST /api/uploads — save a cover image to disk, return its storage path
router.post('/', auth, (req, res) => {
  try {
    const image = req.body && req.body.image;
    if (typeof image !== 'string') return res.status(400).json({ message: 'No image provided' });
    const match = image.match(/^data:(image\/(?:png|jpe?g|gif|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
      return res.status(400).json({ message: 'Unsupported image format. Use PNG, JPEG, GIF or WebP.' });
    }
    const type = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
    const buf = Buffer.from(match[2], 'base64');
    if (!buf.length) return res.status(400).json({ message: 'Empty image file' });
    if (buf.length > MAX_SIZE) return res.status(400).json({ message: 'Image too large (max 2MB)' });
    if (!matchesMagic(buf, type)) {
      return res.status(400).json({ message: 'File content does not match a valid image' });
    }
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${FORMAT[type].ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
    res.status(201).json({ url: `/uploads/${name}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
