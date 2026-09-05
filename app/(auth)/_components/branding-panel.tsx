import Image from "next/image";

export function BrandingPanel() {
  return (
    <div className="hidden h-full flex-col items-center justify-center gap-4 bg-white p-12 text-center lg:flex">
      <Image src="/assets/logo.png" alt="YouVerse" width={84} height={84} priority />
      <h1 className="text-2xl font-semibold text-foreground">
        Your universe of videos
      </h1>
      <p className="text-sm text-muted-foreground">
        Create, watch, and share videos with a community built around you.
      </p>
    </div>
  );
}
