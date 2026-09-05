import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6">
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
  );
}
