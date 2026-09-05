import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <Skeleton className="mb-6 h-8 w-32" />

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}
