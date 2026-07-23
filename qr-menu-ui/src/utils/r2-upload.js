import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const getEnv = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || import.meta.env[`VITE_${key}`] || (typeof process !== 'undefined' && process.env ? process.env[key] : undefined);
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || process.env[`VITE_${key}`];
  }
  return undefined;
};

const R2_ENDPOINT = getEnv('R2_ENDPOINT') || 'https://c7b58ec191afdc0b4809c0e4e98bcceb.r2.cloudflarestorage.com';
const R2_ACCESS_KEY_ID = getEnv('R2_ACCESS_KEY_ID') || '6fde20f97d63c5825d6f9248e483c759';
const R2_SECRET_ACCESS_KEY = getEnv('R2_SECRET_ACCESS_KEY') || 'fd9112ff7a683f679b8ddc54bb23dd0d93d47d12913230eb81b74c4c5cff5986';
const R2_PUBLIC_DOMAIN = getEnv('R2_PUBLIC_DOMAIN') || 'https://pub-6156ea55b2304305a24cfcecaa026166.r2.dev';
const R2_BUCKET_NAME = getEnv('R2_BUCKET_NAME') || 'mydigitalmenu-media';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
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
      Bucket: R2_BUCKET_NAME,
      Key: uniqueFileName,
      Body: bodyData,
      ContentType: (file && file.type) ? file.type : 'image/jpeg',
    });

    await s3Client.send(command);

    const publicDomain = R2_PUBLIC_DOMAIN.replace(/\/$/, '');
    const publicUrl = `${publicDomain}/${uniqueFileName}`;
    return publicUrl;
  } catch (error) {
    console.error('R2 Görsel Yükleme Hatası:', error);
    throw error;
  }
}

export default uploadToR2;
