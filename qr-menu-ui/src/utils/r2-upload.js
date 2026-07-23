import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Cloudflare R2'ye dosya yükler ve resmin tam Public URL'sini döndürür.
 * @param {File|Buffer|Uint8Array} file - Yüklenecek dosya
 * @param {string} [originalName] - Opsiyonel dosya adı
 * @returns {Promise<string>} Yüklenen resmin public URL'si
 */
export async function uploadToR2(file, originalName) {
  try {
    const rawFileName = originalName || (file && file.name ? file.name : 'image.jpg');
    const sanitizedName = rawFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${sanitizedName}`;

    let bodyData = file;
    if (typeof File !== 'undefined' && file instanceof File) {
      bodyData = new Uint8Array(await file.arrayBuffer());
    }

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
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

export default uploadToR2;
