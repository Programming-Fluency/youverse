"use client";

import { useEffect } from "react";
import { TvIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Empty className="min-h-[60vh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TvIcon />
        </EmptyMedia>
        <EmptyTitle>This channel couldn&apos;t load</EmptyTitle>
        <EmptyDescription>
          Something went wrong loading this channel. Please try again.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button className="cursor-pointer" onClick={() => retry()}>
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  );
}
