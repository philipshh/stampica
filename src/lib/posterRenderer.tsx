import { DitherOptions } from './dither';

export const getPosterDimensions = (options: DitherOptions, aspectRatio: string, resolution: 'high' | 'low' = 'high'): { width: number; height: number } => {
    const POSTER_SIZES = {
        'A4': { width: 2480, height: 3508 },
        'A3': { width: 3508, height: 4961 },
        'A2': { width: 4961, height: 7016 }, // Default
        'A1': { width: 7016, height: 9933 },
        'A0': { width: 9933, height: 14043 },
        '18x24': { width: 5400, height: 7200 },
        '24x36': { width: 7200, height: 10800 },
        '27x40': { width: 8100, height: 12000 },
    };

    let size;
    if (aspectRatio === 'custom' && options.poster.customDimensions) {
        size = {
            width: options.poster.customDimensions.width || 2000,
            height: options.poster.customDimensions.height || 2000
        };
    } else {
        size = POSTER_SIZES[aspectRatio as keyof typeof POSTER_SIZES] || POSTER_SIZES['A2'];
    }

    if (resolution === 'low') {
        // Low res: fixed width 1080px, maintain aspect ratio
        const LOW_RES_WIDTH = 1080;
        const ratio = size.height / size.width;
        return {
            width: LOW_RES_WIDTH,
            height: Math.round(LOW_RES_WIDTH * ratio)
        };
    }

    return size;
};


export async function drawPosterToCanvas(
    options: DitherOptions,
    imageData: ImageData | null,
    dimensions: { width: number; height: number }
): Promise<HTMLCanvasElement> {
    console.log('[RENDERER] Starting drawPosterToCanvas', { dimensions, hasImage: !!imageData, iconSectionEnabled: options.poster.iconSection.enabled });

    const canvas = document.createElement('canvas');
    const POSTER_WIDTH = dimensions.width;
    const POSTER_HEIGHT = dimensions.height;

    // Set resolution
    canvas.width = POSTER_WIDTH;
    canvas.height = POSTER_HEIGHT;
    const ctx = canvas.getContext('2d')!;

    // Disable smoothing for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;
    // Prefer lower quality for pixelated nearest-neighbor when scaling dithered bitmaps
    try { ctx.imageSmoothingQuality = 'low'; } catch (e) { /* ignore */ }

    // Prepare image if available
    let image: HTMLImageElement | null = null;
    let gridImages: (HTMLImageElement | null)[] = [];

    if (options.imageMode === 'single' && imageData) {
        image = await createImageFromProcessedData(imageData);
    } else if (options.imageMode === 'grid') {
        gridImages = await Promise.all(options.grid.images.map(async (slot) => {
            if (slot.processedImageData) {
                return await createImageFromProcessedData(slot.processedImageData);
            }
            return null;
        }));
    }

    // ... (rest of the setup)

    // 1. Background
    ctx.fillStyle = options.poster.paperColor;
    ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

    // SCALING FACTORS
    // The preview/export base width is 800px. We scale everything from that reference.
    const REFERENCE_WIDTH = 800;
    const SCALE = POSTER_WIDTH / REFERENCE_WIDTH;

    // Layout Constants (Converted from Tailwind)
    // Calculate padding based on size
    const getPaddingPercent = () => {
        switch (options.poster.paddingSize) {
            case 'S': return 0.03;
            case 'M': return 0.05;
            case 'L': return 0.07;
            default: return 0.05;
        }
    };
    const padding = POSTER_WIDTH * getPaddingPercent();
    const contentWidth = POSTER_WIDTH - (padding * 2);

    // Tailwind: w-8 (2rem = 32px), h-2 (0.5rem = 8px)
    const barWidth = 32 * SCALE;
    const barHeight = 8 * SCALE;
    const barGap = 0; // No gap between rectangles

    // Layout Constants (Converted from Tailwind)
    const gap = (options.poster.gap || 32) * SCALE;

    // Fonts
    // Tailwind: text-xs (0.75rem = 12px)
    const directorFontSize = 12 * SCALE;
    // Tailwind: text-[0.6rem] (9.6px)
    const descFontSize = 9.6 * SCALE;
    // Tailwind: text-4xl (2.25rem = 36px)
    const yearFontSize = 36 * SCALE;
    // Title is user defined px, so we scale it
    const titleFontSize = options.poster.titleFontSize * SCALE;

    const getRectangleColors = () => {
        if (options.colorMode === 'rgb') {
            return [
                '#000000', '#ff0000', '#00ff00', '#0000ff',
                '#ffff00', '#ff00ff', '#00ffff', '#ffffff'
            ];
        }

        switch (options.colorMode) {
            case 'monochrome':
                return [options.monochromeColors.dark, options.monochromeColors.light];
            case 'duotone':
                return [options.duotoneColors.color1, options.duotoneColors.color2];
            case 'tritone':
                return [options.tritoneColors.color1, options.tritoneColors.color2, options.tritoneColors.color3];
            case 'quadtone':
                return [options.quadtoneColors.color1, options.quadtoneColors.color2, options.quadtoneColors.color3, options.quadtoneColors.color4];
            default:
                return [options.poster.textColor];
        }
    };
    const rectangleColors = getRectangleColors().slice(0, 4);

    // Text Color
    ctx.fillStyle = options.poster.textColor;

    // --- DRAWING ---

    // --- DRAWING ---

    let currentY = padding;

    // Helper: Check if section is enabled
    const isSectionEnabled = (section: string) => {
        switch (section) {
            case 'header': return options.poster.showHeader;
            case 'title': return options.poster.showTitle;
            case 'image': return options.poster.showImage;
            case 'footer': return options.poster.showFooter;
            case 'list': return options.poster.listSection.enabled;
            case 'icons': return options.poster.iconSection.enabled;
            default: return false;
        }
    };

    // Define rendering functions for each section
    const renderHeader = (y: number, dryRun: boolean = false) => {
        if (!options.poster.showHeader) return 0;



        if (!dryRun) {
            // Bars with palette colors
            rectangleColors.forEach((color, i) => {
                ctx.fillStyle = color;
                ctx.fillRect(padding + (barWidth + barGap) * i, y, barWidth, barHeight);
            });

            // Director text
            ctx.fillStyle = options.poster.directorTextColor;
            ctx.font = `600 ${directorFontSize}px ${options.poster.bodyFont || 'Inter'}, sans-serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText(options.poster.director, POSTER_WIDTH - padding, y);
        }

        return Math.max(barHeight, directorFontSize);
    };

    const renderTitle = (y: number, dryRun: boolean = false) => {
        if (!options.poster.showTitle) return 0;

        let sectionY = y;
        const startY = y;

        // Title Margin removed in favor of global gap

        // Title
        ctx.fillStyle = options.poster.titleColor || options.poster.textColor;
        ctx.font = `600 ${titleFontSize}px ${options.poster.titleFont || 'Inter'}, sans-serif`;
        if (ctx.letterSpacing !== undefined) {
            ctx.letterSpacing = '-0.05em';
        }
        ctx.textAlign = options.poster.titleAlignment;
        ctx.textBaseline = 'top';

        let titleX = padding;
        if (options.poster.titleAlignment === 'center') titleX = POSTER_WIDTH / 2;
        if (options.poster.titleAlignment === 'right') titleX = POSTER_WIDTH - padding;

        const titleText = options.poster.title || 'UNTITLED';
        const titleLineHeight = titleFontSize * 1.0;
        const titleLines = wrapText(ctx, titleText, titleX, sectionY, contentWidth, titleLineHeight, dryRun);

        sectionY += (titleLines * titleLineHeight);

        // Subtitle
        if (options.poster.showSubtitle && options.poster.subtitle) {
            sectionY += options.poster.subtitleMargin * SCALE;

            const subtitleFontSize = (options.poster.subtitleFontSize || 32) * SCALE;
            ctx.fillStyle = options.poster.subtitleColor || options.poster.textColor;
            ctx.font = `400 ${subtitleFontSize}px ${options.poster.bodyFont || 'Inter'}, sans-serif`;
            if (ctx.letterSpacing !== undefined) {
                ctx.letterSpacing = '-0.02em';
            }

            const subtitleText = options.poster.subtitle;
            const subtitleLineHeight = subtitleFontSize * 1.2;
            const subtitleLines = wrapText(ctx, subtitleText, titleX, sectionY, contentWidth, subtitleLineHeight, dryRun);

            sectionY += (subtitleLines * subtitleLineHeight);
        }

        return sectionY - startY;
    };

    const renderList = (y: number, dryRun: boolean = false) => {
        if (!options.poster.listSection.enabled) return 0;

        let sectionY = y;
        const startY = y;

        // List styling
        const listFontSize = 14 * SCALE; // Slightly larger than director text
        const listLineHeight = listFontSize * 1.5;

        ctx.fillStyle = options.poster.listColor || options.poster.textColor;
        ctx.font = `400 ${listFontSize}px ${options.poster.bodyFont || 'Inter'}, sans-serif`;
        if (ctx.letterSpacing !== undefined) {
            ctx.letterSpacing = '0em';
        }
        ctx.textBaseline = 'top';

        const columns = options.poster.listSection.columns || 1;
        const alignment = options.poster.listSection.alignment || 'left';
        const content = options.poster.listSection.content || [];

        const columnGap = 20 * SCALE;
        const columnWidth = (contentWidth - (columnGap * (columns - 1))) / columns;

        // Distribute items across columns
        const itemsPerColumn = Math.ceil(content.length / columns);

        let maxColumnHeight = 0;

        for (let col = 0; col < columns; col++) {
            let colY = sectionY;
            const colItems = content.slice(col * itemsPerColumn, (col + 1) * itemsPerColumn);

            let colX = padding + (col * (columnWidth + columnGap));

            // Adjust X based on alignment if needed, but usually grid columns are fixed width
            // Alignment mainly affects text alignment within the column
            ctx.textAlign = alignment;
            let textX = colX;
            if (alignment === 'center') textX = colX + columnWidth / 2;
            if (alignment === 'right') textX = colX + columnWidth;

            for (const item of colItems) {
                if (!item.trim()) continue;
                const lines = wrapText(ctx, item, textX, colY, columnWidth, listLineHeight, dryRun);
                colY += lines * listLineHeight;
            }

            maxColumnHeight = Math.max(maxColumnHeight, colY - sectionY);
        }

        sectionY += maxColumnHeight;

        return sectionY - startY;
    };

    const renderFooter = (y: number, dryRun: boolean = false) => {
        if (!options.poster.showFooter) return 0;

        let sectionY = y;

        const footerPaddingTop = 32 * SCALE;

        // Footer border
        if (!dryRun) {
            ctx.fillStyle = options.poster.textColor;
            ctx.fillRect(padding, sectionY, contentWidth, 1);
        }

        const footerContentY = sectionY + footerPaddingTop;
        const isReversed = options.poster.footerLayout === 'reversed';

        const numColumns = options.poster.descriptionColumns || 1;
        const descLineHeight = descFontSize * 1.6;

        ctx.fillStyle = options.poster.descriptionColor || options.poster.textColor;
        ctx.font = `600 ${descFontSize}px ${options.poster.bodyFont || 'Inter'}, sans-serif`;
        if (ctx.letterSpacing !== undefined) {
            ctx.letterSpacing = '0px';
        }
        ctx.textBaseline = 'top';

        let contentHeight = 0;

        if (numColumns === 1) {
            const descWidth = contentWidth * 0.6;
            const description = options.poster.description[0] || '';
            ctx.textAlign = isReversed ? 'right' : 'left';
            const descX = isReversed ? POSTER_WIDTH - padding : padding;
            const descLines = wrapText(ctx, description, descX, footerContentY, descWidth, descLineHeight, dryRun);

            const descH = descLines * descLineHeight;

            // Year beside description
            if (!dryRun) ctx.fillStyle = options.poster.yearColor || options.poster.textColor;
            ctx.font = `600 ${yearFontSize}px ${options.poster.bodyFont || 'Inter'}, sans-serif`;
            if (ctx.letterSpacing !== undefined) {
                ctx.letterSpacing = '-0.05em';
            }
            ctx.textAlign = isReversed ? 'left' : 'right';
            // const yearY = footerContentY + descH; // Align bottom roughly? No, let's use max height

            // Actually original logic had year at bottom of footer area or beside.
            // Let's simplify: Year is drawn relative to description height or fixed?
            // Original: yearY = footerContentY + footerHeight - footerPaddingTop;
            // But we are calculating height now.

            // Let's just say height is max of desc and year
            const yearH = yearFontSize;
            contentHeight = Math.max(descH, yearH);

            if (!dryRun) {
                ctx.textBaseline = 'bottom';
                const yearX = isReversed ? padding : POSTER_WIDTH - padding;
                ctx.fillText(`/${options.poster.year || '24'}`, yearX, footerContentY + contentHeight);
            }
        } else {
            const columnGap = 40 * SCALE;
            const effectiveColumnWidth = (contentWidth - (columnGap * (numColumns - 1))) / numColumns;

            ctx.textAlign = isReversed ? 'right' : 'left';
            let maxDescLines = 0;

            for (let i = 0; i < numColumns; i++) {
                const description = options.poster.description[i] || '';
                let columnX;
                if (isReversed) {
                    columnX = POSTER_WIDTH - padding - (i * (effectiveColumnWidth + columnGap));
                } else {
                    columnX = padding + (i * (effectiveColumnWidth + columnGap));
                }
                const lines = wrapText(ctx, description, columnX, footerContentY, effectiveColumnWidth, descLineHeight, dryRun);
                maxDescLines = Math.max(maxDescLines, lines);
            }

            const descHeight = maxDescLines * descLineHeight;
            const yearY = footerContentY + descHeight;

            if (!dryRun) ctx.fillStyle = options.poster.yearColor || options.poster.textColor;
            ctx.font = `600 ${yearFontSize}px ${options.poster.bodyFont || 'Inter'}, sans-serif`;
            if (ctx.letterSpacing !== undefined) {
                ctx.letterSpacing = '-0.05em';
            }
            ctx.textAlign = isReversed ? 'left' : 'right';
            ctx.textBaseline = 'top';
            const yearX = isReversed ? padding : POSTER_WIDTH - padding;

            if (!dryRun) {
                ctx.fillText(`/${options.poster.year || '24'}`, yearX, yearY);
            }

            contentHeight = descHeight + yearFontSize;
        }
        return footerPaddingTop + contentHeight;
    };

    const renderIcons = async (y: number, dryRun: boolean = false) => {
        if (!options.poster.iconSection.enabled) return 0;

        const items = options.poster.iconSection.items;
        if (!items || items.length === 0) return 0;

        console.log('[RENDERER] renderIcons called', { dryRun, itemCount: items.length, icons: items.map(i => i.icon) });

        const gap_icons = 16 * SCALE;
        const cols = 4;
        const colWidth = (contentWidth - (gap * (cols - 1))) / cols;
        const iconSize = options.poster.iconSection.iconSize * SCALE;
        const fontSize = 12 * SCALE;
        const textGap = 8 * SCALE;

        // Calculate height w/ real wrap
        let maxTextHeight = 0;
        ctx.font = `500 ${fontSize}px ${options.poster.bodyFont || 'Inter'}, sans-serif`;
        // Ensure we check spacing
        if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0.05em';

        for (const item of items) {
            const lines = wrapText(ctx, item.text.toUpperCase(), 0, 0, colWidth, fontSize * 1.4, true);
            maxTextHeight = Math.max(maxTextHeight, lines * (fontSize * 1.4));
        }
        const sectionHeight = iconSize + textGap + maxTextHeight;

        if (!dryRun) {
            const startX = padding;

            for (let i = 0; i < items.length; i++) {
                if (i >= cols) break;
                const item = items[i];
                const colX = startX + (i * (colWidth + gap_icons));

                let alignX = colX + (colWidth / 2);
                if (options.poster.iconSection.alignment === 'left') alignX = colX;
                if (options.poster.iconSection.alignment === 'right') alignX = colX + colWidth;

                const textAlign = options.poster.iconSection.alignment || 'center';

                // 1. Draw Icon
                ctx.save();
                try {
                    console.log(`[RENDERER] Fetching icon: ${item.icon}`);

                    // Timeout promise for fetch and image load
                    const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

                    const rawColor = options.poster.iconSection.iconColor;
                    const encodedColor = encodeURIComponent(rawColor);

                    const isLucide = item.icon.startsWith('lucide:');
                    const hasPrefix = item.icon.includes(':');

                    let svgContent = '';

                    // 1. Specialized Lucide handling
                    if (isLucide) {
                        const lucideName = item.icon.replace('lucide:', '');
                        try {
                            const resp = await Promise.race([
                                fetch(`https://lucide.dev/api/icons/${lucideName}`),
                                timeout(2000)
                            ]) as Response;
                            if (resp.ok) {
                                svgContent = await resp.text();
                                svgContent = svgContent.replace(/stroke="currentColor"/g, `stroke="${rawColor}"`);
                                console.log(`[RENDERER] ✓ Lucide icon fetched: ${item.icon}`);
                            }
                        } catch (e) {
                            console.warn(`[RENDERER] ✗ Lucide fetch failed: ${item.icon}`, e);
                        }
                    }

                    // 2. Generic Iconify handling
                    if (!svgContent) {
                        const iconToTry = hasPrefix ? item.icon : `material-symbols:${item.icon}`;

                        try {
                            const resp = await Promise.race([
                                fetch(`https://api.iconify.design/${iconToTry}.svg?color=${encodedColor}`),
                                timeout(2000)
                            ]) as Response;

                            if (resp.ok) {
                                svgContent = await resp.text();
                                console.log(`[RENDERER] ✓ Iconify icon fetched: ${iconToTry}`);
                            } else if (!hasPrefix) {
                                const base = item.icon.replace(/_/g, '-');
                                const variants = [`${base}-outline`, `${item.icon}-outline`];
                                for (const v of variants) {
                                    const vResp = await fetch(`https://api.iconify.design/material-symbols:${v}.svg?color=${encodedColor}`);
                                    if (vResp.ok) {
                                        svgContent = await vResp.text();
                                        console.log(`[RENDERER] ✓ Iconify variant fetched: material-symbols:${v}`);
                                        break;
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn(`[RENDERER] ✗ Iconify fetch failed: ${iconToTry}`, e);
                        }
                    }

                    if (svgContent) {
                        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
                        const url = URL.createObjectURL(blob);

                        const img = new Image();
                        await Promise.race([
                            new Promise<void>((resolve, reject) => {
                                img.onload = () => resolve();
                                img.onerror = () => reject(new Error('Image load error'));
                                img.src = url;
                            }),
                            timeout(3000)
                        ]);

                        let drawX = alignX - (iconSize / 2);
                        if (textAlign === 'left') drawX = alignX;
                        if (textAlign === 'right') drawX = alignX - iconSize;

                        ctx.drawImage(img, drawX, y, iconSize, iconSize);
                        URL.revokeObjectURL(url);
                    } else {
                        throw new Error('Icon fetch failed');
                    }
                } catch (e) {
                    console.error(`[RENDERER] ✗ Failed to render icon ${item.icon}`, e);
                }
                ctx.restore();

                // 2. Draw Text
                ctx.save();
                ctx.fillStyle = options.poster.iconSection.textColor;
                ctx.textAlign = textAlign;
                ctx.textBaseline = 'top';
                ctx.font = `500 ${fontSize}px ${options.poster.bodyFont || 'Inter'}, sans-serif`;
                if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0.05em';

                const textY = y + iconSize + textGap;
                wrapText(ctx, item.text.toUpperCase(), alignX, textY, colWidth, fontSize * 1.4, false);
                ctx.restore();
            }
        }

        return sectionHeight;
    };

    const renderImage = (y: number, height: number) => {
        if (!options.poster.showImage) return;

        const isImagePaddingNone = options.poster.imagePadding === 'none';
        let imageAreaWidth = isImagePaddingNone ? POSTER_WIDTH : contentWidth;
        let imageAreaHeight = height;
        let imageStartY = y;
        let imageX = isImagePaddingNone ? 0 : padding;

        const getCornerRadius = () => {
            switch (options.poster.imageRoundedCorners) {
                case 'S': return 16 * SCALE;
                case 'M': return 40 * SCALE;
                case 'L': return 64 * SCALE;
                default: return 0;
            }
        };
        const radius = getCornerRadius();

        ctx.save();
        ctx.beginPath();
        if (radius > 0) {
            ctx.roundRect(imageX, imageStartY, imageAreaWidth, imageAreaHeight, radius);
        } else {
            ctx.rect(imageX, imageStartY, imageAreaWidth, imageAreaHeight);
        }
        ctx.clip();

        // Draw background color (clipped)
        if (options.poster.imageBackgroundColor && options.poster.imageBackgroundColor !== 'none') {
            ctx.fillStyle = options.poster.imageBackgroundColor;
            ctx.fillRect(imageX, imageStartY, imageAreaWidth, imageAreaHeight);
        }

        if (options.imageMode === 'single' && image) {
            // Calculate draw dimensions to maintain aspect ratio
            const imgAspect = image.width / image.height;
            const areaAspect = imageAreaWidth / imageAreaHeight;

            let drawWidth, drawHeight;

            if (options.poster.imageScale === 'fill') {
                if (imgAspect > areaAspect) {
                    drawHeight = imageAreaHeight;
                    drawWidth = drawHeight * imgAspect;
                } else {
                    drawWidth = imageAreaWidth;
                    drawHeight = drawWidth / imgAspect;
                }
            } else if (options.poster.imageScale === 'original') {
                drawWidth = image.width;
                drawHeight = image.height;
            } else { // contain
                if (imgAspect > areaAspect) {
                    drawWidth = imageAreaWidth;
                    drawHeight = drawWidth / imgAspect;
                } else {
                    drawHeight = imageAreaHeight;
                    drawWidth = drawHeight * imgAspect;
                }
            }

            let drawX = 0;
            let drawY = 0;

            if (options.poster.imageAlignX === 'left') drawX = imageX;
            else if (options.poster.imageAlignX === 'right') drawX = imageX + imageAreaWidth - drawWidth;
            else drawX = imageX + (imageAreaWidth - drawWidth) / 2;

            if (options.poster.imageAlignY === 'top') drawY = imageStartY;
            else if (options.poster.imageAlignY === 'bottom') drawY = imageStartY + imageAreaHeight - drawHeight;
            else drawY = imageStartY + (imageAreaHeight - drawHeight) / 2;

            drawX = Math.round(drawX);
            drawY = Math.round(drawY);
            drawWidth = Math.ceil(drawWidth);
            drawHeight = Math.ceil(drawHeight);

            ctx.imageSmoothingEnabled = false;
            try { ctx.imageSmoothingQuality = 'low'; } catch (e) { }
            ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        } else if (options.imageMode === 'grid') {
            const rows = options.grid.layout.rows;
            const cols = options.grid.layout.cols;
            const slotGap = padding;
            const slotWidth = (imageAreaWidth - (slotGap * (cols - 1))) / cols;
            const slotHeight = (imageAreaHeight - (slotGap * (rows - 1))) / rows;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const idx = r * cols + c;
                    const slotImg = gridImages[idx];
                    const slotOptions = options.grid.images[idx];

                    if (slotImg && slotOptions) {
                        const sx = imageX + c * (slotWidth + slotGap);
                        const sy = imageStartY + r * (slotHeight + slotGap);

                        const scale = slotOptions.scale || 'fill';
                        const alignX = slotOptions.alignX || 'center';
                        const alignY = slotOptions.alignY || 'center';

                        const imgAspect = slotImg.width / slotImg.height;
                        const slotAspect = slotWidth / slotHeight;

                        let dw, dh, dx, dy;

                        if (scale === 'fill') {
                            // Cover behavior
                            if (imgAspect > slotAspect) {
                                dh = slotHeight;
                                dw = dh * imgAspect;
                            } else {
                                dw = slotWidth;
                                dh = dw / imgAspect;
                            }
                        } else {
                            // Contain behavior
                            if (imgAspect > slotAspect) {
                                dw = slotWidth;
                                dh = dw / imgAspect;
                            } else {
                                dh = slotHeight;
                                dw = dh * imgAspect;
                            }
                        }

                        // X Alignment
                        if (alignX === 'left') dx = sx;
                        else if (alignX === 'right') dx = sx + slotWidth - dw;
                        else dx = sx + (slotWidth - dw) / 2;

                        // Y Alignment
                        if (alignY === 'top') dy = sy;
                        else if (alignY === 'bottom') dy = sy + slotHeight - dh;
                        else dy = sy + (slotHeight - dh) / 2;

                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(sx, sy, slotWidth, slotHeight);
                        ctx.clip();

                        ctx.imageSmoothingEnabled = false;
                        ctx.drawImage(slotImg, dx, dy, dw, dh);
                        ctx.restore();
                    }
                }
            }
        }
        ctx.restore();
    };

    // Main Render Loop
    // 1. Calculate heights of all fixed sections
    const sectionHeights: Record<string, number> = {};
    let totalFixedContentHeight = 0;

    // We need to iterate in order to account for margins that might depend on previous sections?
    // Actually margins are mostly internal to sections in current logic, except image margin.
    // Let's assume sections are self-contained for height calculation.

    for (const section of options.poster.layoutOrder) {
        if (!isSectionEnabled(section)) continue;
        if (section === 'image') continue; // Image is flexible

        let h = 0;
        if (section === 'header') h = renderHeader(0, true);
        else if (section === 'title') h = renderTitle(0, true);
        else if (section === 'list') h = renderList(0, true);
        else if (section === 'footer') h = renderFooter(0, true);
        else if (section === 'icons') h = await renderIcons(0, true);

        sectionHeights[section] = h;
        totalFixedContentHeight += h;
    }

    // 2. Render sections
    // imageMarginBottom is already defined at the top level

    for (let i = 0; i < options.poster.layoutOrder.length; i++) {
        const section = options.poster.layoutOrder[i];
        if (!isSectionEnabled(section)) continue;

        if (section === 'image') {
            // 1. Identify sections after the image to calculate required space
            const enabledSections = options.poster.layoutOrder.filter(s => isSectionEnabled(s));
            const imageIndex = enabledSections.indexOf('image');
            const sectionsAfter = enabledSections.slice(imageIndex + 1);

            let heightAfter = 0;
            for (const nextSection of sectionsAfter) {
                heightAfter += sectionHeights[nextSection];
            }

            // 2. Account for all gaps between sections following the image
            // There is one gap between the image and the next section, 
            // and one gap after each subsequent section except the last one.
            const numGapsAfter = sectionsAfter.length;
            const totalSpaceAfter = heightAfter + (numGapsAfter * gap);

            // 3. Determine the boundary for the bottom of the image
            const isLast = imageIndex === enabledSections.length - 1;
            const isFirst = imageIndex === 0;
            const isImagePaddingNone = options.poster.imagePadding === 'none';

            let bottomBoundary = POSTER_HEIGHT - padding;
            if (isImagePaddingNone && isLast) {
                bottomBoundary = POSTER_HEIGHT;
            }

            const imageEndY = bottomBoundary - totalSpaceAfter;
            let availableHeight = imageEndY - currentY;

            // 4. Handle top-aligned edge-to-edge images
            let drawY = currentY;
            if (isImagePaddingNone && isFirst) {
                availableHeight += currentY; // currentY is the top padding
                drawY = 0;
            }

            if (availableHeight < 0) availableHeight = 0;

            renderImage(drawY, availableHeight);

            currentY = drawY + availableHeight;
            if (!isLast) {
                currentY += gap;
            }
        } else {
            const h = (section === 'header') ? renderHeader(currentY) :
                (section === 'title') ? renderTitle(currentY) :
                    (section === 'list') ? renderList(currentY) :
                        (section === 'footer') ? renderFooter(currentY) :
                            (section === 'icons') ? await renderIcons(currentY) : 0;

            currentY += h;

            // Add gap if not last section
            const enabledSections = options.poster.layoutOrder.filter(s => isSectionEnabled(s));
            const isLast = enabledSections[enabledSections.length - 1] === section;
            if (!isLast) {
                currentY += gap;
            }
        }
    }

    // Apply paper texture overlay if selected and opacity > 0 (render last so it's above content)
    if (options.paperTexture !== 'none' && options.paperTextureOpacity > 0) {
        try {
            const textureImg = new Image();
            textureImg.crossOrigin = 'anonymous';

            await new Promise<void>((resolve) => {
                textureImg.onload = () => {
                    // Set blend mode to multiply
                    ctx.globalCompositeOperation = 'multiply';
                    ctx.globalAlpha = options.paperTextureOpacity / 100;

                    // Draw texture to cover entire canvas
                    ctx.drawImage(textureImg, 0, 0, POSTER_WIDTH, POSTER_HEIGHT);

                    // Reset blend mode and alpha
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 1;

                    resolve();
                };
                textureImg.onerror = () => {
                    console.warn('Failed to load paper texture');
                    resolve(); // Continue even if texture fails to load
                };
                textureImg.src = `/textures/paper-${options.paperTexture}.jpg`;
            });
        } catch (error) {
            console.warn('Error applying paper texture:', error);
        }
    }

    console.log('[RENDERER] ✓ drawPosterToCanvas complete, returning canvas');
    return canvas;
}


// Helper: Wrap Text for Canvas
function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    dryRun: boolean = false
): number {
    const paragraphs = text.split('\n');
    let totalLineCount = 0;
    let currentY = y;

    for (const paragraph of paragraphs) {
        if (paragraph.length === 0) {
            // Empty newline
            currentY += lineHeight;
            totalLineCount++;
            continue;
        }

        const words = paragraph.split(' ');
        const processedWords: string[] = [];
        for (const word of words) {
            if (ctx.measureText(word).width > maxWidth) {
                let currentChunk = '';
                for (const char of word) {
                    if (ctx.measureText(currentChunk + char).width > maxWidth) {
                        processedWords.push(currentChunk);
                        currentChunk = char;
                    } else {
                        currentChunk += char;
                    }
                }
                if (currentChunk) processedWords.push(currentChunk);
            } else {
                processedWords.push(word);
            }
        }

        let line = '';
        for (let n = 0; n < processedWords.length; n++) {
            const testLine = line + processedWords[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                if (!dryRun) ctx.fillText(line.trim(), x, currentY);
                line = processedWords[n] + ' ';
                currentY += lineHeight;
                totalLineCount++;
            } else {
                line = testLine;
            }
        }
        // Draw last line of paragraph
        if (!dryRun) ctx.fillText(line.trim(), x, currentY);
        currentY += lineHeight;
        totalLineCount++;
    }

    return totalLineCount;
}

// Helper: Process Image Data (ensure fully opaque) and return Base64
async function processImageForExport(imageData: ImageData): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;

    const newImageData = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
    // REMOVED: forcing alpha to 255
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.putImageData(newImageData, 0, 0);
    return canvas.toDataURL('image/png');
}

// Helper: Create Image Element from processed URL (for Canvas draw)
async function createImageFromProcessedData(imageData: ImageData): Promise<HTMLImageElement> {
    const url = await processImageForExport(imageData);
    const img = new Image();
    img.src = url;
    await Promise.race([
        new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Image creation failed'));
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Image creation timeout')), 5000))
    ]);
    return img;
}
