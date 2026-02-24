import React, { forwardRef } from 'react';
import { DitherOptions } from '../lib/dither';
import { getPosterDimensions } from '../lib/posterRenderer';
import { Icon } from '@iconify/react';


interface PosterCanvasProps {
    processedImage: ImageData | null;
    options: DitherOptions;
    onUploadTrigger?: () => void;
}

const GridSlotImage: React.FC<{
    data: ImageData;
    scale?: 'fill' | 'contain';
    alignX?: 'left' | 'center' | 'right';
    alignY?: 'top' | 'center' | 'bottom';
}> = ({ data, scale = 'fill', alignX = 'center', alignY = 'center' }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (canvasRef.current && data) {
            const canvas = canvasRef.current;
            canvas.width = data.width;
            canvas.height = data.height;
            const ctx = canvas.getContext('2d')!;

            // Do not force alpha to 255, preserve original transparency
            const newImageData = new ImageData(new Uint8ClampedArray(data.data), data.width, data.height);
            ctx.putImageData(newImageData, 0, 0);
        }
    }, [data]);

    const objectFit = scale === 'fill' ? 'cover' : 'contain';
    const objectPosition = `${alignX} ${alignY}`;

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{
                imageRendering: 'pixelated',
                objectFit,
                objectPosition
            }}
        />
    );
};

export const PosterCanvas = forwardRef<HTMLDivElement, PosterCanvasProps>(({ processedImage, options, onUploadTrigger }, ref) => {
    const { title, year, description, paperColor, textColor, directorTextColor, titleFontSize, director, titleAlignment, footerLayout, imageScale, imageAlignX, imageAlignY, descriptionColumns, imageBackgroundColor } = options.poster;

    // Calculate fixed dimensions based on aspect ratio
    const BASE_WIDTH = 800;
    const getDimensions = () => {
        const fullDims = getPosterDimensions(options, options.poster.aspectRatio, 'high');
        const ratio = fullDims.height / fullDims.width;
        return {
            width: BASE_WIDTH,
            height: Math.round(BASE_WIDTH * ratio)
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
            case 'icons': return options.poster.iconSection.enabled;
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

            const newImageData = new ImageData(new Uint8ClampedArray(processedImage.data), processedImage.width, processedImage.height);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            try { ctx.imageSmoothingEnabled = false; } catch (e) { }
            try { (ctx as any).imageSmoothingQuality = 'low'; } catch (e) { }
            ctx.putImageData(newImageData, 0, 0);
            setImageUrl(canvas.toDataURL());
        }
    }, [processedImage, options.invert]);

    // Define sections as components
    const sections = {
        header: options.poster.showHeader ? (
            <div key="header" className="flex items-start justify-between">
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
            <div key="title" className="relative z-10 w-full flex flex-col" style={{ gap: `${options.poster.subtitleMargin}px` }}>
                <h1
                    className="leading-none break-words w-full"
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
                {(options.poster.showSubtitle && options.poster.subtitle) && (
                    <h2
                        className="leading-none break-words w-full"
                        style={{
                            color: options.poster.subtitleColor || textColor,
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
                marginBottom: (options.poster.imagePadding === 'none' && enabledSections.indexOf('image') === enabledSections.length - 1) ? `-${getPaddingValue()}px` : 0,
                width: options.poster.imagePadding === 'none' ? `calc(100% + ${getPaddingValue() * 2}px)` : '100%',
                flexGrow: (options.poster.imagePadding === 'none' && enabledSections.length === 1) ? 1 : undefined
            }}>
                {/* Background Color Layer */}
                <div
                    className="absolute inset-0 z-0"
                    style={{ backgroundColor: imageBackgroundColor && imageBackgroundColor !== 'none' ? imageBackgroundColor : 'transparent' }}
                />

                {/* Image Layer */}
                {options.imageMode === 'single' ? (
                    processedImage ? (
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
                    )
                ) : (
                    <div
                        className="w-full h-full relative z-10 grid"
                        style={{
                            gridTemplateRows: `repeat(${options.grid.layout.rows}, 1fr)`,
                            gridTemplateColumns: `repeat(${options.grid.layout.cols}, 1fr)`,
                            gap: `${getPaddingValue()}px`, // Change: gap now exactly matches poster padding
                            minHeight: '200px'
                        }}
                    >
                        {options.grid.images.map((slot) => (
                            <div key={slot.id} className="relative bg-neutral-900/10 overflow-hidden">
                                {slot.processedImageData ? (
                                    <GridSlotImage
                                        data={slot.processedImageData}
                                        scale={slot.scale}
                                        alignX={slot.alignX}
                                        alignY={slot.alignY}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-20 border border-dashed border-current rounded">
                                        <span className="text-[10px] uppercase">{slot.id}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ) : null,

        list: options.poster.listSection.enabled ? (
            <div key="list" className="w-full" style={{ color: options.poster.listColor || textColor }}>
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
            <div key="footer" className={`flex pt-8 border-t border-current ${descriptionColumns > 1 ? 'flex-col' : `items-start ${footerLayout === 'reversed' ? 'flex-row-reverse' : 'justify-between'}`}`} style={{ borderTopWidth: '1px' }}>
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
            <div key="icons" className="w-full">
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
                                    <Icon
                                        icon={item.icon || 'material-symbols:help-outline'}
                                        width={options.poster.iconSection.iconSize}
                                        height={options.poster.iconSection.iconSize}
                                    />
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
                gap: `${options.poster.gap}px`
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
