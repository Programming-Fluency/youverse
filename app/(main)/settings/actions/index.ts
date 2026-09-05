"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ok, fail, dbFail } from "@/lib/action-result";

export async function updateProfilePhoto(imageUrl: string) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return fail<{ image: string }>("Not authenticated.");

  try {
    await auth.api.updateUser({
      headers: requestHeaders,
      body: { image: imageUrl },
    });
    return ok({ image: imageUrl });
  } catch {
    return dbFail<{ image: string }>();
  }
}
