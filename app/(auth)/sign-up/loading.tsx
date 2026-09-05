import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex flex-col items-center gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-60" />
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>

      <Skeleton className="mx-auto mt-6 h-4 w-44" />
    </div>
  );
}
