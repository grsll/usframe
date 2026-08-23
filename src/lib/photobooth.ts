import { USFrameCustomization, USFramePhoto } from '../types';

interface RenderOptions {
  photos: USFramePhoto[];
  customization: USFrameCustomization;
}

export async function renderUSFrameCanvas(options: RenderOptions): Promise<string> {
  const { photos, customization } = options;
  if (!photos || photos.length === 0) {
    throw new Error('No photos to render');
  }

  // Load all photo image objects safely
  const loadedImages: HTMLImageElement[] = await Promise.all(
    photos.map(p => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          const retryImg = new Image();
          retryImg.onload = () => resolve(retryImg);
          retryImg.onerror = () => {
            const fallbackCanvas = document.createElement('canvas');
            fallbackCanvas.width = 800;
            fallbackCanvas.height = 600;
            const fctx = fallbackCanvas.getContext('2d');
            if (fctx) {
              fctx.fillStyle = '#292524';
              fctx.fillRect(0, 0, 800, 600);
            }
            const fallbackImg = new Image();
            fallbackImg.onload = () => resolve(fallbackImg);
            fallbackImg.src = fallbackCanvas.toDataURL();
          };
          retryImg.src = p.dataUrl;
        };
        img.src = p.dataUrl;
      });
    })
  );

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const { templateId, layout, customText, showDate, customDate, filter, stamp, fontStyle } = customization;

  // Set high-res dimensions
  if (layout === 'strip-4') {
    canvas.width = 1200;
    canvas.height = 3800;
  } else if (layout === 'grid-2x2') {
    canvas.width = 2400;
    canvas.height = 2800;
  } else {
    // duo-vertical
    canvas.width = 1400;
    canvas.height = 2600;
  }

  // Fill Frame Background
  let bgColor = '#FAF8F5';
  let textColor = '#1C1917';
  let accentColor = '#D95D39';

  if (templateId === 'classic') {
    bgColor = '#FFFFFF';
    textColor = '#111827';
  } else if (templateId === 'terracotta') {
    bgColor = '#F5EBE6';
    textColor = '#5C2D22';
    accentColor = '#C85A48';
  } else if (templateId === 'film35') {
    bgColor = '#121212';
    textColor = '#E5E5E5';
    accentColor = '#F59E0B';
  } else if (templateId === 'midnight') {
    bgColor = '#18181B';
    textColor = '#F4E8D1';
    accentColor = '#D4AF37';
  } else if (templateId === 'polaroid') {
    bgColor = '#FCF9F2';
    textColor = '#292524';
  }

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative border if classic / minimal
  if (templateId === 'classic') {
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
  }

  // Draw 35mm film sprockets if film template
  if (templateId === 'film35') {
    ctx.fillStyle = '#080808';
    const holeWidth = 40;
    const holeHeight = 60;
    const holeSpacing = 100;
    
    for (let y = 60; y < canvas.height - 80; y += holeSpacing) {
      // Left sprocket
      ctx.beginPath();
      ctx.roundRect(25, y, holeWidth, holeHeight, 10);
      ctx.fill();
      
      // Right sprocket
      ctx.beginPath();
      ctx.roundRect(canvas.width - 65, y, holeWidth, holeHeight, 10);
      ctx.fill();
    }

    // Exposure numbers
    ctx.fillStyle = '#F59E0B';
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillText('ISO 400 • US 35MM EXP 04', 100, 70);
  }

  // Draw Photos
  const photoCount = loadedImages.length;

  if (layout === 'strip-4') {
    const marginX = templateId === 'film35' ? 100 : 70;
    const photoWidth = canvas.width - marginX * 2;
    const photoHeight = Math.floor(photoWidth * 0.72);
    const startY = 120;
    const gap = 45;

    for (let i = 0; i < Math.min(4, photoCount); i++) {
      const img = loadedImages[i];
      const y = startY + i * (photoHeight + gap);

      // Photo shadow / border
      ctx.save();
      
      // Apply Photo Filters
      applyCanvasFilter(ctx, filter);

      // Draw image with object-fit: cover
      drawImageCover(ctx, img, marginX, y, photoWidth, photoHeight);
      ctx.restore();

      // Individual photo border
      if (templateId === 'classic') {
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 6;
        ctx.strokeRect(marginX, y, photoWidth, photoHeight);
      } else if (templateId === 'terracotta') {
        ctx.strokeStyle = '#EBD2C7';
        ctx.lineWidth = 4;
        ctx.strokeRect(marginX, y, photoWidth, photoHeight);
      }
    }

    // Bottom Footer Area
    const footerY = startY + 4 * (photoHeight + gap) + 40;
    drawFooter({
      ctx,
      canvas,
      y: footerY,
      textColor,
      accentColor,
      customText: customText || 'US — A Little Place for Two',
      showDate,
      customDate: customDate || new Date().toISOString().split('T')[0],
      stamp,
      fontStyle,
      templateId
    });

  } else if (layout === 'grid-2x2') {
    const margin = 100;
    const gap = 50;
    const cellWidth = (canvas.width - margin * 2 - gap) / 2;
    const cellHeight = cellWidth * 0.9;
    const startY = 140;

    for (let i = 0; i < Math.min(4, photoCount); i++) {
      const img = loadedImages[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = margin + col * (cellWidth + gap);
      const y = startY + row * (cellHeight + gap);

      ctx.save();
      applyCanvasFilter(ctx, filter);
      drawImageCover(ctx, img, x, y, cellWidth, cellHeight);
      ctx.restore();

      if (templateId === 'midnight') {
        ctx.strokeStyle = '#3F3F46';
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, cellWidth, cellHeight);
      }
    }

    const footerY = startY + 2 * (cellHeight + gap) + 60;
    drawFooter({
      ctx,
      canvas,
      y: footerY,
      textColor,
      accentColor,
      customText: customText || 'US — Moments in Time',
      showDate,
      customDate: customDate || new Date().toISOString().split('T')[0],
      stamp,
      fontStyle,
      templateId
    });

  } else if (layout === 'side-by-side') {
    canvas.width = 2400;
    canvas.height = 1800;

    // Side by side duo layout
    const margin = 80;
    const gap = 60;
    const photoWidth = (canvas.width - margin * 2 - gap) / 2;
    const photoHeight = photoWidth * 1.05;
    const startY = 140;

    // Draw Left (Me) and Right (Partner)
    for (let i = 0; i < Math.min(2, photoCount); i++) {
      const img = loadedImages[i];
      const x = margin + i * (photoWidth + gap);
      const y = startY;

      ctx.save();
      applyCanvasFilter(ctx, filter);
      drawImageCover(ctx, img, x, y, photoWidth, photoHeight);
      ctx.restore();

      // Border for each frame
      ctx.strokeStyle = templateId === 'film35' || templateId === 'midnight' ? '#3F3F46' : '#E5E7EB';
      ctx.lineWidth = 6;
      ctx.strokeRect(x, y, photoWidth, photoHeight);
    }

    // Draw center connecting emblem
    ctx.save();
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🤍', canvas.width / 2, startY + photoHeight / 2 + 15);
    ctx.restore();

    const footerY = startY + photoHeight + 80;
    drawFooter({
      ctx,
      canvas,
      y: footerY,
      textColor,
      accentColor,
      customText: customText || 'US — LIVE DUO PHOTOBOOTH',
      showDate,
      customDate: customDate || new Date().toISOString().split('T')[0],
      stamp,
      fontStyle: 'serif',
      templateId
    });

  } else {
    // duo-vertical
    const margin = 90;
    const photoWidth = canvas.width - margin * 2;
    const photoHeight = photoWidth * 0.78;
    const startY = 120;
    const gap = 60;

    for (let i = 0; i < Math.min(2, photoCount); i++) {
      const img = loadedImages[i];
      const y = startY + i * (photoHeight + gap);

      ctx.save();
      applyCanvasFilter(ctx, filter);
      drawImageCover(ctx, img, margin, y, photoWidth, photoHeight);
      ctx.restore();

      ctx.strokeStyle = '#E7E5E4';
      ctx.lineWidth = 4;
      ctx.strokeRect(margin, y, photoWidth, photoHeight);
    }

    const footerY = startY + 2 * (photoHeight + gap) + 60;
    drawFooter({
      ctx,
      canvas,
      y: footerY,
      textColor,
      accentColor,
      customText: customText || 'Our little digital memory.',
      showDate,
      customDate: customDate || new Date().toISOString().split('T')[0],
      stamp,
      fontStyle: 'script',
      templateId
    });
  }

  return canvas.toDataURL('image/png', 0.95);
}

function applyCanvasFilter(ctx: CanvasRenderingContext2D, filter: string) {
  if (filter === 'bw' || filter === 'noir' || filter === 'vintage_noir') {
    ctx.filter = 'grayscale(100%) contrast(135%) brightness(95%)';
  } else if (filter === 'bw_warm') {
    ctx.filter = 'grayscale(100%) sepia(22%) contrast(115%) brightness(104%)';
  } else if (filter === 'warm_film' || filter === 'film400') {
    ctx.filter = 'sepia(25%) saturate(125%) contrast(110%) brightness(102%)';
  } else if (filter === 'golden' || filter === 'golden_hour') {
    ctx.filter = 'sepia(35%) saturate(140%) contrast(105%) brightness(102%) hue-rotate(-10deg)';
  } else if (filter === 'vintage') {
    ctx.filter = 'sepia(45%) contrast(115%) brightness(92%) saturate(90%)';
  } else if (filter === 'tokyo_fade') {
    ctx.filter = 'contrast(92%) brightness(108%) saturate(85%)';
  } else if (filter === 'pastel') {
    ctx.filter = 'saturate(115%) brightness(108%) contrast(95%)';
  } else {
    ctx.filter = 'none';
  }
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.width / img.height;
  const targetRatio = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;

  if (imgRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

interface FooterOptions {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  y: number;
  textColor: string;
  accentColor: string;
  customText: string;
  showDate: boolean;
  customDate: string;
  stamp: string;
  fontStyle: string;
  templateId: string;
}

function drawFooter(opts: FooterOptions) {
  const { ctx, canvas, y, textColor, customText, showDate, customDate, stamp, fontStyle, templateId } = opts;
  const centerX = canvas.width / 2;

  // Title / Caption
  ctx.textAlign = 'center';
  ctx.fillStyle = textColor;

  if (fontStyle === 'serif' || templateId === 'minimal') {
    ctx.font = '600 52px "Playfair Display", Georgia, serif';
  } else if (fontStyle === 'script' || templateId === 'polaroid' || templateId === 'terracotta') {
    ctx.font = '700 68px "Caveat", cursive';
  } else if (fontStyle === 'mono' || templateId === 'film35') {
    ctx.font = '500 42px "JetBrains Mono", monospace';
  } else {
    ctx.font = '600 48px "Plus Jakarta Sans", sans-serif';
  }

  ctx.fillText(customText, centerX, y);

  // Date
  if (showDate && customDate) {
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.7;
    ctx.font = '400 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`• ${customDate} •`, centerX, y + 60);
    ctx.globalAlpha = 1.0;
  }

  // Stamp Badge
  if (stamp && stamp !== 'none') {
    const stampY = y + (showDate ? 130 : 80);
    ctx.save();
    ctx.translate(centerX, stampY);
    ctx.rotate(-0.04);

    ctx.strokeStyle = textColor;
    ctx.lineWidth = 4;
    const badgeWidth = 360;
    const badgeHeight = 60;
    ctx.strokeRect(-badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight);

    ctx.fillStyle = textColor;
    ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(stamp.toUpperCase(), 0, 8);
    ctx.restore();
  }
}
