const sharp = require('sharp');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Lütfen bir dosya seçin.' });
    }

    const file = req.file;

    // Sharp ile görseli işleme: max genişlik 1000px, WebP formatı, %80 kalite
    const optimizedBuffer = await sharp(file.buffer)
      .resize({ width: 1000, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.webp`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'mydigitalmenu-media',
      Key: fileName,
      Body: optimizedBuffer,
      ContentType: 'image/webp',
    });

    await s3Client.send(command);

    const publicDomain = (process.env.R2_PUBLIC_DOMAIN || 'https://pub-6156ea55b2304305a24cfcecaa026166.r2.dev').replace(/\/$/, '');
    const imageUrl = `${publicDomain}/${fileName}`;

    return res.status(200).json({
      success: true,
      imageUrl: imageUrl,
      url: imageUrl,
      publicUrl: imageUrl
    });
  } catch (error) {
    console.error('R2 Yükleme Hatası:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  uploadImage
};
