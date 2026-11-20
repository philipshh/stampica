/** A poster pinned to the wall with a piece of translucent tape. */
export function TapedPoster({ src, rotate, className = '', width = 200, delay = 0 }: {
  src: string; rotate: number; className?: string; width?: number; delay?: number;
}) {
  return (
    <div
      className={`absolute animate-fade-up ${className}`}
      style={{ width, transform: `rotate(${rotate}deg)`, animationDelay: `${delay}s` }}
    >
      <div className="relative bg-white p-2 pb-3 shadow-sheet border border-line">
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-5 bg-vermilion/20 backdrop-blur-[1px]"
          style={{ transform: `translateX(-50%) rotate(${-rotate * 0.6}deg)` }}
        />
        <img src={src} alt="" width={width} height={Math.round(width * 1.414)} loading="eager"
          className="w-full h-auto" draggable={false} />
      </div>
    </div>
  );
}
