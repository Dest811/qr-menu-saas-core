const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Frontend R2 Görsel Yükleyici - Güvenli Backend API Üzerinden Yükleme Yapar
 * @param {File} file - Yüklenecek dosya
 * @returns {Promise<string>} Yüklenen resmin public URL'si
 */
export async function uploadToR2(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Yükleme hatası (${response.status})`);
    }

    const data = await response.json();
    return data.url || data.publicUrl;
  } catch (error) {
    console.error('Görsel Yükleme Hatası (Frontend API):', error);
    throw error;
  }
}

export default uploadToR2;
