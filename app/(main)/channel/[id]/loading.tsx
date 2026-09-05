import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="aspect-[6/1] w-full rounded-none" />

      <div className="mx-auto flex max-w-6xl flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="mx-auto max-w-6xl p-6 pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="aspect-video w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
