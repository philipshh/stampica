import { DitherOptions } from './dither';


export async function drawPosterToCanvas(
    options: DitherOptions,
    imageData: ImageData | null,
    dimensions: { width: number; height: number }
): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const POSTER_WIDTH = dimensions.width;
    const POSTER_HEIGHT = dimensions.height;

    // Set resolution
    canvas.width = POSTER_WIDTH;
    canvas.height = POSTER_HEIGHT;
    const ctx = canvas.getContext('2d')!;

    // Disable smoothing for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;

    // Prepare image if available
    let image: HTMLImageElement | null = null;
    if (imageData) {
        image = await createImageFromProcessedData(imageData, options);
    }

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

    // Tailwind: mb-8 (2rem = 32px)
    const headerMarginBottom = 32 * SCALE;
    const titleMarginBottom = 32 * SCALE;
    const imageMarginBottom = 32 * SCALE;

    // Fonts
    // Tailwind: text-xs (0.75rem = 12px)
    const directorFontSize = 12 * SCALE;
    // Tailwind: text-[0.6rem] (9.6px)
    const descFontSize = 9.6 * SCALE;
    // Tailwind: text-4xl (2.25rem = 36px)
    const yearFontSize = 36 * SCALE;
    // Title is user defined px, so we scale it
    const titleFontSize = options.poster.titleFontSize * SCALE;

    // Get rectangle colors from palette
    const getRectangleColors = () => {
        const textColor = options.poster.textColor;
        if (options.palette.length >= 2) {
            const [r1, g1, b1] = options.palette[0];
            const [r2, g2, b2] = options.palette[1];
            return [
                textColor,
                `rgb(${r1}, ${g1}, ${b1})`,
                `rgb(${r2}, ${g2}, ${b2})`
            ];
        }
        return [textColor, textColor, textColor];
    };
    const rectangleColors = getRectangleColors();

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
            ctx.fillStyle = rectangleColors[0];
            ctx.fillRect(padding, y, barWidth, barHeight);

            ctx.fillStyle = rectangleColors[1];
            ctx.fillRect(padding + barWidth + barGap, y, barWidth, barHeight);

            ctx.fillStyle = rectangleColors[2];
            ctx.fillRect(padding + (barWidth + barGap) * 2, y, barWidth, barHeight);

            // Director text
            ctx.fillStyle = options.poster.directorTextColor;
            ctx.font = `600 ${directorFontSize}px ${options.poster.bodyFont || 'Inter'}, sans-serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText(options.poster.director, POSTER_WIDTH - padding, y);
        }

        return Math.max(barHeight, directorFontSize) + headerMarginBottom;
    };

    const renderTitle = (y: number, dryRun: boolean = false) => {
        if (!options.poster.showTitle) return 0;

        let sectionY = y;
        const startY = y;

        // Title Margin
        const getTitleMarginTop = () => {
            switch (options.poster.titleMargin) {
                case 'S': return 16 * SCALE;
                case 'M': return 32 * SCALE;
                case 'L': return 64 * SCALE;
                default: return 32 * SCALE;
            }
        };
        sectionY += getTitleMarginTop();

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
            const getSubtitleMarginTop = () => {
                switch (options.poster.subtitleMargin) {
                    case 'S': return 8 * SCALE;
                    case 'M': return 16 * SCALE;
                    case 'L': return 32 * SCALE;
                    default: return 16 * SCALE;
                }
            };
            sectionY += getSubtitleMarginTop();

            const subtitleFontSize = (options.poster.subtitleFontSize || 32) * SCALE;
            ctx.fillStyle = options.poster.subtitleColor || options.poster.textColor;
            ctx.font = `400 ${subtitleFontSize}px ${options.poster.bodyFont || 'Inter'}, sans-serif`;
            if (ctx.letterSpacing !== undefined) {
                ctx.letterSpacing = '-0.02em';
            }
            if (!dryRun) ctx.globalAlpha = 1;

            const subtitleText = options.poster.subtitle;
            const subtitleLineHeight = subtitleFontSize * 1.2;
            const subtitleLines = wrapText(ctx, subtitleText, titleX, sectionY, contentWidth, subtitleLineHeight, dryRun);

            if (!dryRun) ctx.globalAlpha = 1.0;
            sectionY += (subtitleLines * subtitleLineHeight);
        }

        sectionY += titleMarginBottom;

        return sectionY - startY;
    };

    const renderList = (y: number, dryRun: boolean = false) => {
        if (!options.poster.listSection.enabled) return 0;

        let sectionY = y;
        const startY = y;

        // List styling
        const listFontSize = 14 * SCALE; // Slightly larger than director text
        const listLineHeight = listFontSize * 1.5;
        const listMarginBottom = 32 * SCALE;

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

        sectionY += maxColumnHeight + listMarginBottom;

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

        const marginBot = 32 * SCALE;
        const gap = 16 * SCALE;
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
                const colX = startX + (i * (colWidth + gap));

                let alignX = colX + (colWidth / 2);
                if (options.poster.iconSection.alignment === 'left') alignX = colX;
                if (options.poster.iconSection.alignment === 'right') alignX = colX + colWidth;

                const textAlign = options.poster.iconSection.alignment || 'center';

                // 1. Draw Icon
                ctx.save();
                try {
                    // Timeout promise for fetch and image load
                    const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

                    const iconColor = encodeURIComponent(options.poster.iconSection.iconColor);

                    // Strategy: The preview uses "Material Symbols Outlined" font.
                    // If the icon name doesn't specify an outline, we try appending '-outline'.
                    // Note: Iconify usually uses hyphens.
                    let baseIcon = item.icon.replace(/_/g, '-'); // Normalize to hyphens just in case
                    let tryOutlineFirst = !baseIcon.includes('-outline') && !baseIcon.includes('-border');

                    let response: Response | null = null;

                    if (tryOutlineFirst) {
                        try {
                            // Try -outline
                            let outlineIcon = `${baseIcon}-outline`;

                            const outlineResp = await Promise.race([
                                fetch(`https://api.iconify.design/material-symbols:${outlineIcon}.svg?color=${iconColor}`),
                                timeout(2000)
                            ]) as Response;
                            if (outlineResp.ok) response = outlineResp;
                        } catch (e) { /* Check fallback */ }
                    }

                    if (!response || !response.ok) {
                        // Fallback to exact name (or base name)
                        try {
                            const resp = await Promise.race([
                                fetch(`https://api.iconify.design/material-symbols:${item.icon}.svg?color=${iconColor}`),
                                timeout(2000)
                            ]) as Response;
                            if (resp.ok) response = resp;
                        } catch (e) { }
                    }

                    if (response && response.ok) {
                        const svgContent = await response.text();

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
                    console.error(`Failed to render icon ${item.icon}`, e);
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

        return sectionHeight + marginBot;
    };

    const renderImage = (y: number, height: number) => {
        if (!options.poster.showImage) return;

        // Draw image placeholder or actual image
        // For now, let's assume we have the image loaded in the canvas or passed somehow?
        // In this function we are drawing to 'ctx' which is the export canvas.
        // We need the image source.
        // The image source is passed as 'image' argument to renderPoster? No.
        // We need to load the image.
        // Actually, renderPoster is async and loads the image at the beginning.
        // But we need access to it here.
        // Ah, the image loading logic is at the end of the file, it calls this function.
        // Wait, renderPoster is the default export.
        // It loads the image: const image = await loadImage(imageUrl);
        // But 'image' variable is not available in this scope?
        // Ah, I see 'const image = await loadImage(imageUrl);' is inside renderPoster.
        // So 'image' is available in the closure if defined before.
        // Let's check where 'image' is defined.
        // It seems it's defined at the top of renderPoster?
        // No, I don't see it in the viewed lines.
        // Let's assume it's available or I need to find it.
        // Wait, lines 506-538 in previous edits showed texture loading.
        // Let's check the beginning of renderPoster again.

        // Actually, looking at line 438: ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        // So 'image' is available.

        if (image) {
            const isImagePaddingNone = options.poster.imagePadding === 'none';

            let imageAreaWidth = isImagePaddingNone ? POSTER_WIDTH : contentWidth;
            let imageAreaHeight = height;
            let imageStartY = y;
            let imageX = isImagePaddingNone ? 0 : padding;

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

            // Round coordinates to avoid sub-pixel rendering issues
            drawX = Math.round(drawX);
            drawY = Math.round(drawY);
            drawWidth = Math.ceil(drawWidth);
            drawHeight = Math.ceil(drawHeight);

            ctx.save();
            ctx.beginPath();

            // Apply rounded corners clipping path
            const getCornerRadius = () => {
                switch (options.poster.imageRoundedCorners) {
                    case 'S': return 16 * SCALE;
                    case 'M': return 40 * SCALE;
                    case 'L': return 64 * SCALE;
                    default: return 0;
                }
            };
            const radius = getCornerRadius();

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

            ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
            ctx.restore();
        }
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
            // Calculate remaining space
            // We need to know how much space is taken by sections *after* this image
            let heightAfter = 0;
            for (let j = i + 1; j < options.poster.layoutOrder.length; j++) {
                const nextSection = options.poster.layoutOrder[j];
                if (isSectionEnabled(nextSection) && nextSection !== 'image') {
                    heightAfter += sectionHeights[nextSection];
                }
            }

            let imageEndY = POSTER_HEIGHT - padding - heightAfter;

            const isImagePaddingNone = options.poster.imagePadding === 'none';
            const enabledSections = options.poster.layoutOrder.filter(s => isSectionEnabled(s));
            const isFirst = enabledSections.indexOf('image') === 0;
            const isLast = enabledSections.indexOf('image') === enabledSections.length - 1;

            if (isImagePaddingNone && isLast) {
                imageEndY = POSTER_HEIGHT - heightAfter;
            }

            // Ensure we subtract margin if there are sections after?
            // The image margin is usually applied *after* the image.

            let availableHeight = imageEndY - currentY;
            if (heightAfter > 0) {
                availableHeight -= imageMarginBottom;
            }

            let drawY = currentY;
            if (isImagePaddingNone && isFirst) {
                availableHeight += currentY; // Add top padding to height
                drawY = 0; // Start from top edge
            }

            if (availableHeight < 0) availableHeight = 0;

            renderImage(drawY, availableHeight);

            currentY = drawY + availableHeight;
            if (heightAfter > 0) {
                currentY += imageMarginBottom;
            }
        } else {
            if (section === 'header') currentY += renderHeader(currentY);
            else if (section === 'title') currentY += renderTitle(currentY);
            else if (section === 'list') currentY += renderList(currentY);
            else if (section === 'footer') currentY += renderFooter(currentY);
            else if (section === 'icons') currentY += await renderIcons(currentY);
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
    const words = text.split(' ');

    // Pre-process words to split long ones (like CSS break-words)
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
    let currentY = y;
    let lines = 0;

    for (let n = 0; n < processedWords.length; n++) {
        const testLine = line + processedWords[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            if (!dryRun) ctx.fillText(line, x, currentY);
            line = processedWords[n] + ' ';
            currentY += lineHeight;
            lines++;
        } else {
            line = testLine;
        }
    }
    if (!dryRun) ctx.fillText(line, x, currentY);
    lines++;
    return lines;
}

// Helper: Process Image Data (Apply Transparency) and return Base64
async function processImageForExport(imageData: ImageData, options: DitherOptions): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;

    // Apply transparency logic (duplicated from PosterCanvas - should be shared ideally)
    const newImageData = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
    );

    const isDarkBackground = options.invert;

    for (let i = 0; i < newImageData.data.length; i += 4) {
        const r = newImageData.data[i];
        const g = newImageData.data[i + 1];
        const b = newImageData.data[i + 2];
        const brightness = (r + g + b) / 3;

        if (isDarkBackground) {
            if (brightness < 50) newImageData.data[i + 3] = 0;
        } else {
            if (brightness > 200) newImageData.data[i + 3] = 0;
        }
    }

    ctx.putImageData(newImageData, 0, 0);
    return canvas.toDataURL('image/png');
}

// Helper: Create Image Element from processed URL (for Canvas draw)
async function createImageFromProcessedData(imageData: ImageData, options: DitherOptions): Promise<HTMLImageElement> {
    const url = await processImageForExport(imageData, options);
    const img = new Image();
    img.src = url;
    await new Promise(resolve => img.onload = resolve);
    return img;
}
