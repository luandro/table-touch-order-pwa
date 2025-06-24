export function resizeImage(file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error('Failed to read file'));
        return;
      }
      img.src = e.target.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate new dimensions while maintaining aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
      const newWidth = img.width * ratio;
      const newHeight = img.height * ratio;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw and resize image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          // Create new file with same name and type
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          resolve(resizedFile);
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPG, PNG, and WebP files are allowed'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 5MB'
    };
  }
  // Additional validation: Check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  if (!extension || !validExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'Invalid file extension'
    };
  }

  return { valid: true };
}
