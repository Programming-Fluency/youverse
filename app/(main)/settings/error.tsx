"use client";

import { useEffect } from "react";
import { UserCogIcon } from "lucide-react";
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
          <UserCogIcon />
        </EmptyMedia>
        <EmptyTitle>Settings couldn&apos;t load</EmptyTitle>
        <EmptyDescription>
          Something went wrong loading your settings. Please try again.
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
