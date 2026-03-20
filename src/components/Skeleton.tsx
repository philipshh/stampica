export function SkeletonCard() {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-20 aspect-[1/1.41] bg-neutral-800 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-3.5 bg-neutral-800 rounded w-32" />
          <div className="h-3 bg-neutral-800 rounded w-24" />
          <div className="h-2.5 bg-neutral-800 rounded w-16" />
          <div className="h-8 bg-neutral-800 rounded-full w-full mt-4" />
        </div>
      </div>
    </div>
  );
}
