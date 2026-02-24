
export const generateRandomColor = (): string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

export const generateRandomPalette = (mode: 'duotone' | 'tritone' | 'quadtone') => {
    if (mode === 'duotone') {
        return {
            color1: generateRandomColor(),
            color2: generateRandomColor(),
        };
    } else if (mode === 'tritone') {
        return {
            color1: generateRandomColor(),
            color2: generateRandomColor(),
            color3: generateRandomColor(),
        };
    } else {
        return {
            color1: generateRandomColor(),
            color2: generateRandomColor(),
            color3: generateRandomColor(),
            color4: generateRandomColor(),
        };
    }
};

export const extractColors = async (imageSource: File | HTMLImageElement, count: number = 3): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const processImage = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Resize for faster processing
            const MAX_SIZE = 200;
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height).data;
            const colorMap: { [key: string]: number } = {};

            for (let i = 0; i < imageData.length; i += 4) {
                // Simple quantization by rounding to nearest 16
                const r = Math.round(imageData[i] / 16) * 16;
                const g = Math.round(imageData[i + 1] / 16) * 16;
                const b = Math.round(imageData[i + 2] / 16) * 16;

                // Skip transparent or very translucent pixels
                if (imageData[i + 3] < 128) continue;

                // Convert to hex
                const toHex = (c: number) => {
                    const hex = c.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                };

                const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
                colorMap[hex] = (colorMap[hex] || 0) + 1;
            }

            const sortedColors = Object.entries(colorMap)
                .sort(([, a], [, b]) => b - a)
                .map(([color]) => color)
                .slice(0, count);

            // If we didn't find enough colors, fill with random ones or defaults
            while (sortedColors.length < count) {
                sortedColors.push(generateRandomColor());
            }

            resolve(sortedColors);
        };

        if (imageSource instanceof File) {
            img.src = URL.createObjectURL(imageSource);
            img.onload = () => {
                processImage();
                URL.revokeObjectURL(img.src);
            };
            img.onerror = reject;
        } else {
            img.src = imageSource.src;
            if (img.complete) {
                processImage();
            } else {
                img.onload = processImage;
                img.onerror = reject;
            }
        }
    });
};

export const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
};

export const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (c: number) => {
        const h = Math.max(0, Math.min(255, Math.round(c))).toString(16);
        return h.length === 1 ? '0' + h : h;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const interpolateColors = (colors: string[], steps: number): string[] => {
    if (colors.length < 2) return colors;
    if (steps <= colors.length) return colors;

    const result: string[] = [];
    const segments = colors.length - 1;
    const stepsPerSegment = (steps - 1) / segments;

    for (let i = 0; i < segments; i++) {
        const start = hexToRgb(colors[i]);
        const end = hexToRgb(colors[i + 1]);

        for (let j = 0; j < stepsPerSegment; j++) {
            const t = j / stepsPerSegment;
            const r = start[0] + (end[0] - start[0]) * t;
            const g = start[1] + (end[1] - start[1]) * t;
            const b = start[2] + (end[2] - start[2]) * t;
            result.push(rgbToHex(r, g, b));
        }
    }
    result.push(colors[colors.length - 1]);
    return result;
};

