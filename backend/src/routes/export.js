const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const fetch = require('node-fetch');

const ICONIFY_API = 'https://api.iconify.design';
const { isPermissivePrefix } = require('../utils/permissiveLicenses');

function rejectIfBlocked(prefix, res) {
  if (!isPermissivePrefix(prefix)) {
    res.status(403).json({
      error: 'Icon set not in the commercial-safe catalog (MIT, Apache, ISC, CC0 only).',
    });
    return true;
  }
  return false;
}

async function fetchSVG(prefix, name, color, size) {
  const response = await fetch(
    `${ICONIFY_API}/${prefix}/${name}.svg?color=${encodeURIComponent(color)}&width=${size}&height=${size}`
  );
  if (!response.ok) throw new Error('Failed to fetch icon SVG');
  return response.buffer();
}

// Export as PNG
router.post('/png', async (req, res) => {
  try {
    const { prefix, name, color = '#000000', size = 512, background } = req.body;
    if (rejectIfBlocked(prefix, res)) return;
    const svgBuffer = await fetchSVG(prefix, name, color, size);

    let sharpInstance = sharp(svgBuffer);
    if (background && background !== 'transparent') {
      sharpInstance = sharpInstance.flatten({ background });
    }

    const pngBuffer = await sharpInstance.png().toBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${name}.png"`);
    res.send(pngBuffer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Export as JPG
router.post('/jpg', async (req, res) => {
  try {
    const { prefix, name, color = '#000000', size = 512, background = '#ffffff' } = req.body;
    if (rejectIfBlocked(prefix, res)) return;
    const svgBuffer = await fetchSVG(prefix, name, color, size);

    const jpgBuffer = await sharp(svgBuffer)
      .flatten({ background: background === 'transparent' ? '#ffffff' : background })
      .jpeg({ quality: 95 })
      .toBuffer();

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${name}.jpg"`);
    res.send(jpgBuffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Export as WebP
router.post('/webp', async (req, res) => {
  try {
    const { prefix, name, color = '#000000', size = 512, background } = req.body;
    if (rejectIfBlocked(prefix, res)) return;
    const svgBuffer = await fetchSVG(prefix, name, color, size);

    let sharpInstance = sharp(svgBuffer);
    if (background && background !== 'transparent') {
      sharpInstance = sharpInstance.flatten({ background });
    }

    const webpBuffer = await sharpInstance.webp({ quality: 95 }).toBuffer();
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Disposition', `attachment; filename="${name}.webp"`);
    res.send(webpBuffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Export as ICO
router.post('/ico', async (req, res) => {
  try {
    const { prefix, name, color = '#000000' } = req.body;
    if (rejectIfBlocked(prefix, res)) return;
    // Generate multiple sizes for ICO
    const sizes = [16, 32, 48, 64];
    const pngBuffers = await Promise.all(
      sizes.map(async (s) => {
        const svg = await fetchSVG(prefix, name, color, s);
        return sharp(svg).png().toBuffer();
      })
    );

    // Use the 32px version as primary
    res.setHeader('Content-Type', 'image/x-icon');
    res.setHeader('Content-Disposition', `attachment; filename="${name}.ico"`);
    res.send(pngBuffers[1]); // 32x32 as fallback
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Bulk download (ZIP)
router.post('/bulk', async (req, res) => {
  try {
    const archiver = require('archiver');
    const { icons, color = '#000000', size = 512, format = 'svg' } = req.body;

    if (!icons || !Array.isArray(icons) || icons.length === 0) {
      return res.status(400).json({ error: 'No icons provided' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="icons.zip"');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const iconId of icons.slice(0, 50)) {
      const [prefix, ...rest] = iconId.split(':');
      if (!isPermissivePrefix(prefix)) continue;
      const name = rest.join(':');
      try {
        const svgBuffer = await fetchSVG(prefix, name, color, size);
        if (format === 'svg') {
          archive.append(svgBuffer, { name: `${name}.svg` });
        } else if (format === 'png') {
          const pngBuffer = await sharp(svgBuffer).png().toBuffer();
          archive.append(pngBuffer, { name: `${name}.png` });
        }
      } catch {}
    }

    archive.finalize();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
