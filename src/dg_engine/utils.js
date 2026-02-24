// Utility functions for dithering algorithms

export function toGrayscale(data) {
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        data[i] = data[i + 1] = data[i + 2] = gray;
    }
}

export function applyDuotone(data, palette) {
    let color1Hex, color2Hex;
    if (palette && palette.length >= 2) {
        color1Hex = palette[0];
        color2Hex = palette[1];
    } else {
        color1Hex = (document.getElementById('color1') && document.getElementById('color1').value) || '#000000';
        color2Hex = (document.getElementById('color2') && document.getElementById('color2').value) || '#ffffff';
    }
    const color1 = hexToRgb(color1Hex);
    const color2 = hexToRgb(color2Hex);

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const gray = data[i] / 255;

        data[i] = Math.round(color1.r * (1 - gray) + color2.r * gray);
        data[i + 1] = Math.round(color1.g * (1 - gray) + color2.g * gray);
        data[i + 2] = Math.round(color1.b * (1 - gray) + color2.b * gray);
    }
}

export function applyTritone(data, palette) {
    let color1Hex, color2Hex, color3Hex;
    if (palette && palette.length >= 3) {
        color1Hex = palette[0];
        color2Hex = palette[1];
        color3Hex = palette[2];
    } else {
        color1Hex = (document.getElementById('color1') && document.getElementById('color1').value) || '#000000';
        color2Hex = (document.getElementById('color2') && document.getElementById('color2').value) || '#888888';
        color3Hex = (document.getElementById('color3') && document.getElementById('color3').value) || '#ffffff';
    }
    const color1 = hexToRgb(color1Hex);
    const color2 = hexToRgb(color2Hex);
    const color3 = hexToRgb(color3Hex);

    const shadowColor = {
        r: Math.max(0, Math.floor(color1.r * 0.75)),
        g: Math.max(0, Math.floor(color1.g * 0.75)),
        b: Math.max(0, Math.floor(color1.b * 0.75))
    };

    const midtoneColor = color2;

    const color1Brightness = (color1.r * 0.299) + (color1.g * 0.587) + (color1.b * 0.114);
    const color3Brightness = (color3.r * 0.299) + (color3.g * 0.587) + (color3.b * 0.114);
    const highlightColor = color1Brightness > color3Brightness ? color1 : color3;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const value = data[i];

        if (value < 85) {
            data[i] = shadowColor.r;
            data[i + 1] = shadowColor.g;
            data[i + 2] = shadowColor.b;
        } else if (value < 170) {
            data[i] = midtoneColor.r;
            data[i + 1] = midtoneColor.g;
            data[i + 2] = midtoneColor.b;
        } else {
            data[i] = highlightColor.r;
            data[i + 1] = highlightColor.g;
            data[i + 2] = highlightColor.b;
        }
    }
}

export function applyCartoon(data, palette) {
    // Find the dominant color in the image
    const colorCounts = {};
    let maxCount = 0;
    let dominantColor = { r: 128, g: 128, b: 128 };

    // Sample pixels to find dominant color (every 4th pixel for performance)
    for (let i = 0; i < data.length; i += 16) {
        const r = Math.floor(data[i] / 32) * 32;     // Quantize to reduce similar colors
        const g = Math.floor(data[i + 1] / 32) * 32;
        const b = Math.floor(data[i + 2] / 32) * 32;

        const colorKey = `${r},${g},${b}`;
        colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;

        if (colorCounts[colorKey] > maxCount) {
            maxCount = colorCounts[colorKey];
            dominantColor = { r, g, b };
        }
    }

    // Create color palette based on dominant color with limited shades
    const shades = [
        { r: Math.max(0, dominantColor.r - 60), g: Math.max(0, dominantColor.g - 60), b: Math.max(0, dominantColor.b - 60) }, // Dark
        { r: Math.max(0, dominantColor.r - 30), g: Math.max(0, dominantColor.g - 30), b: Math.max(0, dominantColor.b - 30) }, // Medium dark
        dominantColor, // Base color
        { r: Math.min(255, dominantColor.r + 30), g: Math.min(255, dominantColor.g + 30), b: Math.min(255, dominantColor.b + 30) }, // Medium light
        { r: Math.min(255, dominantColor.r + 60), g: Math.min(255, dominantColor.g + 60), b: Math.min(255, dominantColor.b + 60) }  // Light
    ];

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate brightness and map to limited shades
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        // Map brightness to one of 5 shades (cartoon-like quantization)
        let shadeIndex;
        if (brightness < 51) shadeIndex = 0;        // 0-20%
        else if (brightness < 102) shadeIndex = 1;  // 20-40%
        else if (brightness < 153) shadeIndex = 2;  // 40-60%
        else if (brightness < 204) shadeIndex = 3;  // 60-80%
        else shadeIndex = 4;                        // 80-100%

        const selectedShade = shades[shadeIndex];
        data[i] = selectedShade.r;
        data[i + 1] = selectedShade.g;
        data[i + 2] = selectedShade.b;
    }
}

export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

export function quantizeValue(value, colorMode) {
    if (colorMode === 'tritone') {
        // 3-level quantization for tritone mode (keep existing behavior)
        if (value < 85) return 0;     // Shadow
        if (value < 170) return 128;  // Midtone
        return 255;                   // Highlight
    } else if (colorMode === 'quadtone') {
        // 4-level quantization for quadtone mode
        if (value < 64) return 0;      // Shadow
        if (value < 128) return 85;    // Mid-shadow
        if (value < 192) return 170;   // Mid-highlight
        return 255;                    // Highlight
    } else {
        // 2-level quantization for monochrome and duotone modes
        return value > 128 ? 255 : 0;
    }
}

export function distributeError(data, width, height, x, y, channel, error, matrix) {
    if (!matrix || !data) return;
    matrix.forEach(([dx, dy, factor]) => {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const idx = (ny * width + nx) * 4 + channel;
            data[idx] = Math.max(0, Math.min(255, data[idx] + error * factor));
        }
    });
}

export function applyDuotone_cli(data, palette) { return applyDuotone(data, palette); }
export function applyTritone_cli(data, palette) { return applyTritone(data, palette); }
export function applyCartoon_cli(data, palette) { return applyCartoon(data, palette); }
export function applyQuadtone_cli(data, palette) { return applyQuadtone(data, palette); }

export function applyQuadtone(data, palette) {
    let color1Hex, color2Hex, color3Hex, color4Hex;
    if (palette && palette.length >= 4) {
        color1Hex = palette[0];
        color2Hex = palette[1];
        color3Hex = palette[2];
        color4Hex = palette[3];
    } else {
        color1Hex = (document.getElementById('color1') && document.getElementById('color1').value) || '#000000';
        color2Hex = (document.getElementById('color2') && document.getElementById('color2').value) || '#555555';
        color3Hex = (document.getElementById('color3') && document.getElementById('color3').value) || '#aaaaaa';
        color4Hex = (document.getElementById('color4') && document.getElementById('color4').value) || '#ffffff';
    }

    const c1 = hexToRgb(color1Hex);
    const c2 = hexToRgb(color2Hex);
    const c3 = hexToRgb(color3Hex);
    const c4 = hexToRgb(color4Hex);

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const value = data[i];

        if (value < 64) {
            data[i] = c1.r; data[i + 1] = c1.g; data[i + 2] = c1.b;
        } else if (value < 128) {
            data[i] = c2.r; data[i + 1] = c2.g; data[i + 2] = c2.b;
        } else if (value < 192) {
            data[i] = c3.r; data[i + 1] = c3.g; data[i + 2] = c3.b;
        } else {
            data[i] = c4.r; data[i + 1] = c4.g; data[i + 2] = c4.b;
        }
    }
}