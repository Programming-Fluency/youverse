import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const f = createUploadthing();

async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new UploadThingError("Unauthorized");
  return session;
}

export const ourFileRouter = {
  channelBanner: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await requireSession();
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, userId: metadata.userId };
    }),

  videoThumbnail: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await requireSession();
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, userId: metadata.userId };
    }),

  video: f({ video: { maxFileSize: "512MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await requireSession();
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, userId: metadata.userId };
    }),

  profilePhoto: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await requireSession();
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, userId: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
