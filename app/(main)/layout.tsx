import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Navbar } from "./components/navbar";

export default async function MainLayout({ children }: LayoutProps<"/">) {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <>
      <Navbar session={session} />
      {children}
    </>
  );
}
