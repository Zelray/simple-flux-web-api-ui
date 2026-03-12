'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ApiKeyInput } from "./api-key-input";
import { ImageIcon, VideoIcon, FolderOpen, Settings } from "lucide-react";

const mainRoutes = [
  {
    href: "/",
    label: "Image",
    icon: ImageIcon
  },
  {
    href: "/video",
    label: "Video",
    icon: VideoIcon
  },
  {
    href: "/library",
    label: "Library",
    icon: FolderOpen
  }
] as const;

export function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname.startsWith("/flux");
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-xl">
            FAL.AI
          </Link>
          <nav className="flex items-center gap-1">
            {mainRoutes.map((route) => {
              const Icon = route.icon;
              return (
                <Button
                  key={route.href}
                  asChild
                  variant={isActive(route.href) ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "transition-colors gap-2",
                    isActive(route.href) && "bg-secondary"
                  )}
                >
                  <Link href={route.href}>
                    <Icon className="h-4 w-4" />
                    {route.label}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ApiKeyInput />
          <Button
            asChild
            variant={pathname === "/settings" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9"
          >
            <Link href="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
} 