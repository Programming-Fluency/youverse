import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="flex flex-col gap-8">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-4">
            <Skeleton className="aspect-[6/1] w-full" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, videoIndex) => (
                <div key={videoIndex} className="flex flex-col gap-2">
                  <Skeleton className="aspect-video w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
