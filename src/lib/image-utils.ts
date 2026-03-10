export function cropBase64Image(
  base64Data: string,
  x: number,
  y: number,
  width: number,
  height: number,
  _sourceWidth: number,
  _sourceHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('No canvas context');
        return;
      }
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl.replace(/^data:image\/png;base64,/, ''));
    };
    img.onerror = () => reject('Failed to load image');
    img.src = `data:image/png;base64,${base64Data}`;
  });
}
