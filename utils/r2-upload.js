const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: "auto",
  endpoint: "https://c7b58ec191afdc0b4809c0e4e98bcceb.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "6fde20f97d63c5825d6f9248e483c759",
    secretAccessKey: "fd9112ff7a683f679b8ddc54bb23dd0d93d47d12913230eb81b74c4c5cff5986",
  },
});

async function uploadToR2(file, originalName) {
  try {
    const rawFileName = originalName || (file && file.name ? file.name : 'image.jpg');
    const sanitizedName = rawFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${sanitizedName}`;

    let bodyData = file;

    const command = new PutObjectCommand({
      Bucket: "mydigitalmenu-media",
      Key: uniqueFileName,
      Body: bodyData,
      ContentType: (file && file.type) ? file.type : 'image/jpeg',
    });

    await s3Client.send(command);

    const publicDomain = (process.env.R2_PUBLIC_DOMAIN || 'https://pub-6156ea55b2304305a24cfcecaa026166.r2.dev').replace(/\/$/, '');
    const publicUrl = `${publicDomain}/${uniqueFileName}`;
    return publicUrl;
  } catch (error) {
    console.error('R2 Görsel Yükleme Hatası:', error);
    throw error;
  }
}

module.exports = {
  uploadToR2,
  s3Client
};
