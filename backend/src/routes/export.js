const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const localIcons = require('../services/localIcons');
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
  const svg = localIcons.getIconSVG(prefix, name, { color, width: size, height: size });
  if (!svg) throw new Error('Failed to get icon SVG');
  return Buffer.from(svg, 'utf8');
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

// Export as ICO (32×32 PNG payload; accepts raw SVG from the editor)
router.post('/ico', async (req, res) => {
  try {
    const { prefix, name, color = '#000000', svg: rawSvg } = req.body;
    if (!rawSvg && rejectIfBlocked(prefix, res)) return;

    const sizes = [16, 32, 48, 64];
    const pngBuffers = await Promise.all(
      sizes.map(async (s) => {
        const svgBuffer = rawSvg
          ? Buffer.from(rawSvg, 'utf8')
          : await fetchSVG(prefix, name, color, s);
        return sharp(svgBuffer)
          .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
      })
    );

    const filename = rawSvg ? 'icon.ico' : `${name}.ico`;
    res.setHeader('Content-Type', 'image/x-icon');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pngBuffers[1]);
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
