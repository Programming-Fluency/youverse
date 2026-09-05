"use client";

import { useState } from "react";
import { CameraIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";
import { updateProfilePhoto } from "../actions";
import { UploadButton } from "@/lib/uploadthing";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ProfilePhotoForm({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) {
  const [currentImage, setCurrentImage] = useState(image);
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar className="size-20">
          <AvatarImage src={currentImage ?? undefined} alt={name} />
          <AvatarFallback>
            <UserIcon className="size-8" />
          </AvatarFallback>
        </Avatar>
        <AvatarBadge className="size-6 [&>svg]:size-3.5">
          <CameraIcon />
        </AvatarBadge>
      </div>

      <div className="text-center">
        <p className="font-medium text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground">
          Upload a new profile photo (max 2MB)
        </p>
      </div>

      <UploadButton
        endpoint="profilePhoto"
        disabled={isUploading}
        onUploadBegin={() => setIsUploading(true)}
        onClientUploadComplete={async (res) => {
          const url = res[0]?.ufsUrl;
          if (!url) {
            setIsUploading(false);
            return;
          }

          const result = await updateProfilePhoto(url);
          setIsUploading(false);

          if (!result.success) {
            toast.error(result.error);
            return;
          }

          setCurrentImage(result.data.image);
          toast.success("Profile photo updated.");
        }}
        onUploadError={(error: Error) => {
          setIsUploading(false);
          toast.error(error.message);
        }}
      />
    </div>
  );
}
