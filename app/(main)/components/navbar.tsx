"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserIcon } from "lucide-react";
import type { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth-client";
import { search, type SearchResult } from "../search/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

export function Navbar({ session }: { session: Session }) {
  return (
    <header className="sticky top-0 z-50 flex items-center gap-4 border-b bg-background px-4 py-2">
      <Link href="/home" className="shrink-0">
        <Image src="/assets/logo.png" alt="YouVerse" width={84} height={84} />
      </Link>

      <div className="mx-auto w-full max-w-2xl flex-1">
        <SearchBar />
      </div>

      <div className="shrink-0">
        {session ? (
          <AccountMenu session={session} />
        ) : (
          <Button className="cursor-pointer" render={<Link href="/" />}>
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}

function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    const timeout = setTimeout(async () => {
      const result = await search(trimmed);
      setIsLoading(false);
      setResults(result.success ? result.data : { channels: [], videos: [] });
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function handleQueryChange(value: string) {
    setQuery(value);

    if (!value.trim()) {
      setResults(null);
      setIsLoading(false);
      setOpen(false);
      return;
    }

    setOpen(true);
    setIsLoading(true);
  }

  function goToFullResults() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  const channels = results?.channels.slice(0, 5) ?? [];
  const videos = results?.videos.slice(0, 5) ?? [];
  const hasResults = channels.length > 0 || videos.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        nativeButton={false}
        render={
          <Input
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                goToFullResults();
              }
            }}
            placeholder="Search"
            className="h-12 w-full text-base"
          />
        }
      />
      <PopoverContent className="w-(--anchor-width)" align="start" initialFocus={false}>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner />
          </div>
        ) : !hasResults ? (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No results
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {channels.map((channel) => (
              <Link
                key={channel._id}
                href={`/channel/${channel._id}`}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                {channel.name}
              </Link>
            ))}
            {videos.map((video) => (
              <Link
                key={video._id}
                href={`/watch/${video._id}`}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                {video.title}
              </Link>
            ))}
            <button
              type="button"
              onClick={goToFullResults}
              className="cursor-pointer rounded-md px-2 py-1.5 text-left text-sm font-medium text-primary hover:bg-accent"
            >
              See all results for &quot;{query.trim()}&quot;
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function AccountMenu({ session }: { session: NonNullable<Session> }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="cursor-pointer rounded-full">
            <Avatar className="size-12">
              <AvatarImage src={session.user.image ?? undefined} alt={session.user.name} />
              <AvatarFallback>
                <UserIcon className="size-6" />
              </AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <DropdownMenuContent className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{session.user.name}</span>
              <span className="text-xs text-muted-foreground">{session.user.email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/dashboard" />}>Dashboard</DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/home/subscriptions" />}>
            Subscriptions
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings" />}>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
