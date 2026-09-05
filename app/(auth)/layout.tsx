import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { BrandingPanel } from "./_components/branding-panel";

export default async function AuthLayout({
  children,
}: LayoutProps<"/">) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/home");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandingPanel />
      <div className="flex items-center justify-center p-6 sm:p-12">
        {children}
      </div>
    </div>
  );
}
