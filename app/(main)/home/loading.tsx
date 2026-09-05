import { Skeleton } from "@/components/ui/skeleton";

function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 p-6">
      <section className="flex flex-col gap-4">
        <Skeleton className="h-6 w-28" />
        <VideoGridSkeleton />
      </section>
      <section className="flex flex-col gap-4">
        <Skeleton className="h-6 w-36" />
        <VideoGridSkeleton />
      </section>
    </div>
  );
}
