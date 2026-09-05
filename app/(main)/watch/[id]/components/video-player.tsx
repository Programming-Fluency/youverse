"use client";

import { useEffect, useRef } from "react";
import { recordView } from "../actions";

export function VideoPlayer({ videoId, videoUrl }: { videoId: string; videoUrl: string }) {
  const hasRecordedView = useRef(false);

  useEffect(() => {
    if (hasRecordedView.current) return;
    hasRecordedView.current = true;
    recordView(videoId);
  }, [videoId]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video src={videoUrl} controls className="size-full" />
    </div>
  );
}
