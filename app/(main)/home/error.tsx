"use client";

import { useEffect } from "react";
import { HomeIcon } from "lucide-react";
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
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HomeIcon />
        </EmptyMedia>
        <EmptyTitle>Home couldn&apos;t load</EmptyTitle>
        <EmptyDescription>
          Something went wrong loading your home feed. Please try again.
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
