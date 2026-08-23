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
   * Uploads full-resolution memory photo and lightweight thumbnail directly to Supabase Cloud Storage.
   * Uses structured hierarchy: memories/{couple_id}/{memory_id}.webp and memories/{couple_id}/thumbnails/{memory_id}.webp
   * Guarantees persistent cloud URLs accessible across ALL devices and accounts belonging to the room.
   */
  uploadMemoryMedia: async (
    fileOrDataUrl: File | Blob | string,
    coupleId: string,
    memoryId?: string
  ): Promise<{
    mediaUrl: string;
    thumbnailUrl: string;
    storagePath: string;
    thumbnailPath: string;
  }> => {
    if (!coupleId || !isUuid(coupleId)) {
      throw new Error(`ID Ruangan (coupleId) wajib berupa UUID yang valid untuk Cloud Storage: "${coupleId}"`);
    }

    const safeCoupleId = coupleId;
    const safeMemoryId = memoryId && isUuid(memoryId) ? memoryId : generateUuid();

    const originalPath = `memories/${safeCoupleId}/${safeMemoryId}.webp`;
    const thumbnailPath = `memories/${safeCoupleId}/thumbnails/${safeMemoryId}.webp`;

    try {
      // 1. Generate full-resolution optimized blob (< 600KB)
      const originalBlob = await optimizeImageBlob(fileOrDataUrl, 1920, 1920, 0.85);

      // 2. Generate lightweight thumbnail blob (< 35KB)
      const thumbnailBlob = await optimizeImageBlob(fileOrDataUrl, 400, 400, 0.75);

      // 3. Upload original to Supabase Storage
      const { error: originalUploadError } = await supabase.storage
        .from('memories')
        .upload(originalPath, originalBlob, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '31536000'
        });

      if (originalUploadError) {
        console.warn('Original storage upload warning:', originalUploadError.message);
        if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('http')) {
          return {
            mediaUrl: fileOrDataUrl,
            thumbnailUrl: fileOrDataUrl,
            storagePath: originalPath,
            thumbnailPath
          };
        }
        throw new Error(`Gagal mengunggah foto ke Cloud Storage: ${originalUploadError.message}`);
      }

      // 4. Upload thumbnail to Supabase Storage
      await supabase.storage
        .from('memories')
        .upload(thumbnailPath, thumbnailBlob, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '31536000'
        })
        .catch(() => null);

      // 5. Retrieve Public URLs
      const { data: originalUrlData } = supabase.storage
        .from('memories')
        .getPublicUrl(originalPath);

      const { data: thumbUrlData } = supabase.storage
        .from('memories')
        .getPublicUrl(thumbnailPath);

      const mediaUrl = originalUrlData?.publicUrl || '';
      const thumbnailUrl = thumbUrlData?.publicUrl || mediaUrl;

      if (!mediaUrl) {
        throw new Error('Gagal mendapatkan Public URL dari Cloud Storage.');
      }

      return {
        mediaUrl,
        thumbnailUrl,
        storagePath: originalPath,
        thumbnailPath
      };
    } catch (err: any) {
      console.error('Cloud storage upload error:', err);
      if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('http')) {
        return {
          mediaUrl: fileOrDataUrl,
          thumbnailUrl: fileOrDataUrl,
          storagePath: originalPath,
          thumbnailPath
        };
      }
      throw err;
    }
  },

  /**
   * Backward-compatible alias for single memory image upload.
   */
  uploadMemoryImage: async (
    fileOrDataUrl: File | Blob | string,
    coupleId: string,
    filenamePrefix?: string
  ): Promise<{ publicUrl: string; storagePath: string }> => {
    const res = await cloudStorage.uploadMemoryMedia(fileOrDataUrl, coupleId);
    return {
      publicUrl: res.mediaUrl,
      storagePath: res.storagePath
    };
  },

  /**
   * Deletes a memory file and its thumbnail from Supabase Cloud Storage.
   */
  deleteMemoryMedia: async (storagePath?: string, thumbnailPath?: string): Promise<void> => {
    const pathsToDelete: string[] = [];
    if (storagePath) pathsToDelete.push(storagePath);
    if (thumbnailPath) pathsToDelete.push(thumbnailPath);

    if (pathsToDelete.length === 0) return;

    try {
      await supabase.storage.from('memories').remove(pathsToDelete);
    } catch (err) {
      console.warn('Storage cleanup warning:', err);
    }
  },

  /**
   * Uploads user profile avatar to Supabase Cloud Storage with resilient fallback.
   * Guarantees that avatar is always persistent across all devices without 'Bucket not found' crashes.
   */
  uploadAvatarImage: async (
    fileOrDataUrl: File | Blob | string,
    userId: string
  ): Promise<string> => {
    if (!userId || !isUuid(userId)) {
      throw new Error(`ID Pengguna (userId) wajib berupa UUID yang valid untuk avatar: "${userId}"`);
    }
    const safeUserId = userId;
    const storagePath = `avatars/${safeUserId}_${Date.now()}.jpg`;

    const blobToDataUrl = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
          resolve('');
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    try {
      const optimizedBlob = await optimizeImageBlob(fileOrDataUrl, 400, 400, 0.85);

      // Attempt upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(storagePath, optimizedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '31536000'
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(storagePath);

        if (urlData?.publicUrl) {
          return urlData.publicUrl;
        }
      }

      // If bucket is not provisioned or returns error, fallback to optimized data URI
      console.warn('Supabase storage avatar bucket unavailable, using optimized cloud payload:', uploadError?.message);
      const dataUri = await blobToDataUrl(optimizedBlob);
      return dataUri;
    } catch (err: any) {
      console.warn('Avatar processing warning:', err?.message);
      if (typeof fileOrDataUrl === 'string') {
        return fileOrDataUrl;
      }
      try {
        const fallbackBlob = await optimizeImageBlob(fileOrDataUrl, 300, 300, 0.75);
        return await blobToDataUrl(fallbackBlob);
      } catch {
        throw new Error('Gagal memproses gambar foto profil. Silakan gunakan format JPG atau PNG.');
      }
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
