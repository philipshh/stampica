import React, { forwardRef } from 'react';
import { DitherOptions } from '../lib/dither';


interface PosterCanvasProps {
    processedImage: ImageData | null;
    options: DitherOptions;
    onUploadTrigger?: () => void;
}

export const PosterCanvas = forwardRef<HTMLDivElement, PosterCanvasProps>(({ processedImage, options, onUploadTrigger }, ref) => {
    const { title, year, description, paperColor, textColor, directorTextColor, titleFontSize, director, titleAlignment, footerLayout, imageScale, imageAlignX, imageAlignY, aspectRatio, descriptionColumns, imageBackgroundColor } = options.poster;

    // Calculate fixed dimensions based on aspect ratio
    const BASE_WIDTH = 800;
    const getDimensions = () => {
        const heightRatio = (() => {
            switch (aspectRatio) {
                case 'A4':
                case 'A3':
                case 'A2':
                case 'A1':
                case 'A0':
                    return 1.414;
                case '18x24':
                    return 24 / 18;
                case '24x36':
                    return 36 / 24;
                case '27x40':
                    return 40 / 27;
                default:
                    return 1.414;
            }
        })();

        return {
            width: BASE_WIDTH,
            height: Math.round(BASE_WIDTH * heightRatio)
        };
    };

    const dimensions = getDimensions();

    // Calculate padding based on size
    const getPadding = () => {
        const { paddingSize } = options.poster;
        switch (paddingSize) {
            case 'S': return '3%';
            case 'M': return '5%';
            case 'L': return '7%';
            default: return '5%';
        }
    };

    // Get rectangle colors from palette
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

    // Calculate padding value in pixels
    const getPaddingValue = () => {
        const { paddingSize } = options.poster;
        switch (paddingSize) {
            case 'S': return dimensions.width * 0.03;
            case 'M': return dimensions.width * 0.05;
            case 'L': return dimensions.width * 0.07;
            default: return dimensions.width * 0.05;
        }
    };

    // Determine enabled sections for layout logic
    const enabledSections = options.poster.layoutOrder.filter(section => {
        switch (section) {
            case 'header': return options.poster.showHeader;
            case 'title': return options.poster.showTitle;
            case 'image': return options.poster.showImage;
            case 'list': return options.poster.listSection.enabled;
            case 'footer': return options.poster.showFooter;
            default: return false;
        }
    });

    // We need to render the ImageData to a canvas first to use it as an image source
    const [imageUrl, setImageUrl] = React.useState<string>('');

    React.useEffect(() => {
        if (processedImage) {
            const canvas = document.createElement('canvas');
            canvas.width = processedImage.width;
            canvas.height = processedImage.height;
            const ctx = canvas.getContext('2d')!;

            // Create a new ImageData with transparency
            const newImageData = new ImageData(
                new Uint8ClampedArray(processedImage.data),
                processedImage.width,
                processedImage.height
            );

            // If inverted (white on black), make black transparent
            // If normal (black on white), make white transparent
            const isDarkBackground = options.invert;

            for (let i = 0; i < newImageData.data.length; i += 4) {
                const r = newImageData.data[i];
                const g = newImageData.data[i + 1];
                const b = newImageData.data[i + 2];

                // Simple threshold for transparency
                const brightness = (r + g + b) / 3;

                if (isDarkBackground) {
                    // Make dark pixels transparent
                    if (brightness < 50) {
                        newImageData.data[i + 3] = 0;
                    }
                } else {
                    // Make light pixels transparent
                    if (brightness > 200) {
                        newImageData.data[i + 3] = 0;
                    }
                }
            }

            ctx.putImageData(newImageData, 0, 0);
            setImageUrl(canvas.toDataURL());
        }
    }, [processedImage, options.invert]);

    // Define sections as components
    const sections = {
        header: options.poster.showHeader ? (
            <div key="header" className="flex items-start justify-between mb-8">
                <div className="flex gap-0">
                    {rectangleColors.map((color, i) => (
                        <div key={i} className="w-8 h-2" style={{ backgroundColor: color }}></div>
                    ))}
                </div>
                <div className="text-xs text-right" style={{ color: directorTextColor, letterSpacing: 'normal', fontWeight: 600 }}>
                    {director}
                </div>
            </div>
        ) : null,

        title: options.poster.showTitle ? (
            <div key="title" className="mb-8 relative z-10 w-full" style={{
                marginTop: options.poster.titleMargin === 'S' ? '16px' : options.poster.titleMargin === 'L' ? '64px' : '32px'
            }}>
                <h1
                    className="leading-none mb-2 break-words w-full"
                    style={{
                        color: options.poster.titleColor || textColor,
                        fontSize: `${titleFontSize}px`,
                        textAlign: titleAlignment,
                        letterSpacing: '-0.05em',
                        fontWeight: 600,
                        fontFamily: `${options.poster.titleFont || 'Inter'}, sans-serif`
                    }}
                >
                    {title || 'UNTITLED'}
                </h1>
                {options.poster.showSubtitle && options.poster.subtitle && (
                    <h2
                        className="leading-none break-words w-full"
                        style={{
                            color: options.poster.subtitleColor || textColor,
                            marginTop: options.poster.subtitleMargin === 'S' ? '8px' : options.poster.subtitleMargin === 'L' ? '32px' : '16px',
                            fontSize: `${options.poster.subtitleFontSize || 32}px`,
                            textAlign: titleAlignment,
                            letterSpacing: '-0.02em',
                            fontWeight: 400,
                            fontFamily: `${options.poster.bodyFont || 'Inter'}, sans-serif`
                        }}
                    >
                        {options.poster.subtitle}
                    </h2>
                )}
            </div>
        ) : null,

        image: options.poster.showImage ? (
            <div key="image" className="flex-1 relative overflow-hidden" style={{
                borderRadius: options.poster.imageRoundedCorners === 'S' ? '16px' :
                    options.poster.imageRoundedCorners === 'M' ? '40px' :
                        options.poster.imageRoundedCorners === 'L' ? '64px' : '0px',
                // Image Padding Logic
                marginLeft: options.poster.imagePadding === 'none' ? `-${getPaddingValue()}px` : 0,
                marginRight: options.poster.imagePadding === 'none' ? `-${getPaddingValue()}px` : 0,
                marginTop: (options.poster.imagePadding === 'none' && enabledSections.indexOf('image') === 0) ? `-${getPaddingValue()}px` : 0,
                marginBottom: (options.poster.imagePadding === 'none' && enabledSections.indexOf('image') === enabledSections.length - 1) ? `-${getPaddingValue()}px` : '2rem',
                width: options.poster.imagePadding === 'none' ? `calc(100% + ${getPaddingValue() * 2}px)` : '100%',
                flexGrow: (options.poster.imagePadding === 'none' && enabledSections.length === 1) ? 1 : undefined
            }}>
                {/* Background Color Layer */}
                <div
                    className="absolute inset-0 z-0"
                    style={{ backgroundColor: imageBackgroundColor && imageBackgroundColor !== 'none' ? imageBackgroundColor : 'transparent' }}
                />

                {/* Image Layer */}
                {processedImage ? (
                    <div
                        className="w-full h-full relative z-10"
                        style={{
                            backgroundImage: `url(${imageUrl})`,
                            backgroundSize: imageScale === 'fill' ? 'cover' : imageScale === 'original' ? 'auto' : 'contain',
                            backgroundPosition: `${imageAlignX} ${imageAlignY}`,
                            backgroundRepeat: 'no-repeat',
                            imageRendering: 'pixelated',
                            minHeight: '200px'
                        }}
                    />
                ) : (
                    <button
                        onClick={onUploadTrigger}
                        className="relative z-10 flex flex-col items-center justify-center gap-4 text-current opacity-30 hover:opacity-100 transition-opacity w-full h-full border-2 border-dashed border-current rounded-lg min-h-[200px]"
                    >
                        <span className="text-4xl">+</span>
                        <span className="uppercase tracking-widest text-xs font-bold">Upload Image</span>
                    </button>
                )}
            </div>
        ) : null,

        list: options.poster.listSection.enabled ? (
            <div key="list" className="mb-8 w-full" style={{ color: options.poster.listColor || textColor }}>
                <div
                    className={`grid gap-5 w-full`}
                    style={{
                        gridTemplateColumns: `repeat(${options.poster.listSection.columns || 1}, 1fr)`,
                        textAlign: options.poster.listSection.alignment || 'left'
                    }}
                >
                    {(() => {
                        const content = options.poster.listSection.content || [];
                        const columns = options.poster.listSection.columns || 1;
                        const itemsPerColumn = Math.ceil(content.length / columns);

                        return Array.from({ length: columns }).map((_, colIndex) => (
                            <div key={colIndex} className="flex flex-col gap-1">
                                {content.slice(colIndex * itemsPerColumn, (colIndex + 1) * itemsPerColumn).map((item, i) => (
                                    <div key={i} className="text-sm leading-relaxed whitespace-pre-wrap" style={{ fontWeight: 400 }}>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        ));
                    })()}
                </div>
            </div>
        ) : null,

        footer: options.poster.showFooter ? (
            <div key="footer" className={`flex mt-auto pt-8 border-t border-current ${descriptionColumns > 1 ? 'flex-col' : `items-start ${footerLayout === 'reversed' ? 'flex-row-reverse' : 'justify-between'}`}`} style={{ borderTopWidth: '1px' }}>
                {descriptionColumns === 1 ? (
                    <>
                        <div className={`max-w-[60%] text-[0.6rem] leading-relaxed whitespace-pre-wrap ${footerLayout === 'reversed' ? 'text-right ml-auto' : 'text-left'}`} style={{ color: options.poster.descriptionColor || textColor, letterSpacing: 'normal', fontWeight: 600 }}>
                            {description[0] || ''}
                        </div>
                        <div className={`text-4xl ${footerLayout === 'reversed' ? 'mr-auto' : 'ml-auto'}`} style={{ color: options.poster.yearColor || textColor, letterSpacing: '-0.05em', fontWeight: 600 }}>
                            /{year || '24'}
                        </div>
                    </>
                ) : (
                    <>
                        <div className={`flex gap-10 text-[0.6rem] leading-relaxed w-full ${footerLayout === 'reversed' ? 'flex-row-reverse' : ''}`} style={{ color: options.poster.descriptionColor || textColor, letterSpacing: 'normal', fontWeight: 600 }}>
                            {Array.from({ length: descriptionColumns }).map((_, index) => (
                                <div key={index} className={`flex-1 ${footerLayout === 'reversed' ? 'text-right' : 'text-left'}`}>
                                    {description[index] || ''}
                                </div>
                            ))}
                        </div>
                        <div className={`text-4xl mt-2 ${footerLayout === 'reversed' ? 'text-left' : 'text-right'}`} style={{ color: options.poster.yearColor || textColor, letterSpacing: '-0.05em', fontWeight: 600 }}>
                            /{year || '24'}
                        </div>
                    </>
                )}
            </div>
        ) : null,

        icons: options.poster.iconSection.enabled ? (
            <div key="icons" className="mb-8 w-full">
                <div
                    className="grid grid-cols-4 gap-4 w-full"
                    style={{ textAlign: options.poster.iconSection.alignment }}
                >
                    {options.poster.iconSection.items.map((item, i) => {
                        return (
                            <div key={i} className="flex flex-col gap-2 items-center" style={{
                                alignItems: options.poster.iconSection.alignment === 'left' ? 'flex-start' :
                                    options.poster.iconSection.alignment === 'right' ? 'flex-end' : 'center'
                            }}>
                                <div style={{ color: options.poster.iconSection.iconColor }}>
                                    <span
                                        className="material-symbols-outlined"
                                        style={{
                                            fontSize: `${options.poster.iconSection.iconSize}px`,
                                            display: 'block',
                                            lineHeight: 1
                                        }}
                                    >
                                        {item.icon}
                                    </span>
                                </div>
                                <div
                                    className="text-xs uppercase tracking-wider font-medium"
                                    style={{ color: options.poster.iconSection.textColor }}
                                >
                                    {item.text}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        ) : null
    };

    // Determine section order based on layoutOrder
    const orderedSections = Array.isArray(options.poster.layoutOrder)
        ? options.poster.layoutOrder.map(section => sections[section as keyof typeof sections])
        : [sections.header, sections.title, sections.image, sections.footer];

    return (
        <div
            ref={ref}
            className="relative shadow-2xl overflow-hidden flex flex-col"
            style={{
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                backgroundColor: paperColor,
                color: textColor,
                padding: getPadding(),
                fontFamily: `${options.poster.bodyFont || 'Inter'}, sans-serif`,
            }}
        >
            {orderedSections.filter(section => section !== null)}

            {/* Paper Texture Overlay - render last so it's above content */}
            {options.paperTexture !== 'none' && options.paperTextureOpacity > 0 && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(/textures/paper-${options.paperTexture}.jpg)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: options.paperTextureOpacity / 100,
                        mixBlendMode: 'multiply',
                        zIndex: 9999
                    }}
                />
            )}
        </div>
    );
});

PosterCanvas.displayName = 'PosterCanvas';
