export function SkeletonCard() {
  return (
    <div className="bg-surface border border-line rounded-2xl p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-20 aspect-[1/1.41] bg-paper rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-3.5 bg-paper rounded w-32" />
          <div className="h-3 bg-paper rounded w-24" />
          <div className="h-2.5 bg-paper rounded w-16" />
          <div className="h-8 bg-paper rounded-full w-full mt-4" />
        </div>
      </div>
    </div>
  );
}
