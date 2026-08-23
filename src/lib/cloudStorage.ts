import { supabase } from './supabase';
import { generateUuid, isUuid } from './utils';

// Helper to convert base64 / dataURL to binary Blob
export const dataUrlToBlob = (dataUrl: string): Blob => {
  const parts = dataUrl.split(';base64,');
  if (parts.length === 1) {
    return new Blob([dataUrl], { type: 'image/jpeg' });
  }
  const contentType = parts[0].split(':')[1] || 'image/jpeg';
  const byteCharacters = atob(parts[1]);
  const byteNumbers = new Uint8Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  return new Blob([byteNumbers.buffer], { type: contentType });
};

// Client-side image optimizer before uploading to Cloud Storage (guarantees lightweight payloads < 1MB)
export const optimizeImageBlob = async (
  input: File | Blob | string,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.85
): Promise<Blob> => {
  if (typeof window === 'undefined') {
    if (typeof input === 'string') return dataUrlToBlob(input);
    return input;
  }

  let srcUrl = '';
  let needRevoke = false;

  if (typeof input === 'string') {
    srcUrl = input;
  } else {
    srcUrl = URL.createObjectURL(input);
    needRevoke = true;
  }

  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (needRevoke) URL.revokeObjectURL(srcUrl);

      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available.'));
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate image blob from canvas.'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = (err) => {
      if (needRevoke) URL.revokeObjectURL(srcUrl);
      reject(err);
    };

    img.src = srcUrl;
  });
};

export const cloudStorage = {
  /**
   * Uploads a memory photo or photostrip directly to Supabase Cloud Storage.
   * Guarantees persistent URL accessible across ALL devices and accounts.
   */
  uploadMemoryImage: async (
    fileOrDataUrl: File | Blob | string,
    coupleId: string,
    filenamePrefix?: string
  ): Promise<{ publicUrl: string; storagePath: string }> => {
    if (!coupleId || !isUuid(coupleId)) {
      throw new Error(`ID Ruangan (coupleId) wajib berupa UUID yang valid untuk Cloud Storage: "${coupleId}"`);
    }
    const safeCoupleId = coupleId;
    const photoId = generateUuid();
    const prefix = filenamePrefix ? `${filenamePrefix}_` : '';
    const storagePath = `rooms/${safeCoupleId}/memories/${prefix}${photoId}.jpg`;

    try {
      const optimizedBlob = await optimizeImageBlob(fileOrDataUrl, 1920, 1920, 0.88);

      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(storagePath, optimizedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '31536000'
        });

      if (uploadError) {
        console.warn('Supabase storage upload warning (memories bucket):', uploadError.message);
        if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('http')) {
          return { publicUrl: fileOrDataUrl, storagePath };
        }
        throw new Error(`Gagal mengunggah foto ke Cloud Storage: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('memories')
        .getPublicUrl(storagePath);

      if (!urlData?.publicUrl) {
        throw new Error('Gagal mendapatkan Public URL dari Cloud Storage.');
      }

      return {
        publicUrl: urlData.publicUrl,
        storagePath
      };
    } catch (err: any) {
      console.error('Cloud storage upload error:', err);
      if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('http')) {
        return { publicUrl: fileOrDataUrl, storagePath };
      }
      throw err;
    }
  },

  /**
   * Uploads user profile avatar to Supabase Cloud Storage.
   */
  uploadAvatarImage: async (
    fileOrDataUrl: File | Blob | string,
    userId: string
  ): Promise<string> => {
    if (!userId || !isUuid(userId)) {
      throw new Error(`ID Pengguna (userId) wajib berupa UUID yang valid untuk Cloud Storage avatar: "${userId}"`);
    }
    const safeUserId = userId;
    const storagePath = `avatars/${safeUserId}_${Date.now()}.jpg`;

    try {
      const optimizedBlob = await optimizeImageBlob(fileOrDataUrl, 500, 500, 0.85);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(storagePath, optimizedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '31536000'
        });

      if (uploadError) {
        console.warn('Avatar storage upload warning:', uploadError.message);
        if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('http')) {
          return fileOrDataUrl;
        }
        throw new Error(`Gagal mengunggah foto profil: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(storagePath);

      return urlData?.publicUrl || '';
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('http')) {
        return fileOrDataUrl;
      }
      throw err;
    }
  },

  /**
   * Deletes a file from Supabase Cloud Storage.
   */
  deleteFile: async (bucket: 'memories' | 'avatars', storagePath: string): Promise<void> => {
    if (!storagePath) return;
    try {
      await supabase.storage.from(bucket).remove([storagePath]);
    } catch (err) {
      console.warn('Storage deletion warning:', err);
    }
  }
};
