import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
