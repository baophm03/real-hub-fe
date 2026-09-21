"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { useUserStore } from "@/lib/stores/user-store";
import { useRouter } from "next/navigation";
import {
  Menu,
  LogOut,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/hooks/use-theme";
import { usePostApiLogout } from "@/lib/api/endpoints/auth";
import { usePortalPath } from "@/lib/hooks/use-portal";
import { NotificationMenu } from "@/components/layout/portal/notification-menu";

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const user = useUserStore((s) => s.user);
  const tenantCode = useAuthStore((s) => s.tenantCode);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const portalPath = usePortalPath();

  const initials = user?.fullName
    ?.split(" ")
    .slice(-2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "U";

  // mutation
  const { mutate: logoutMutation } = usePostApiLogout({
    mutation: {
      onError: (error) => {
        console.error("Logout error:", error);
      },
    },
  });

  const handleLogout = async () => {
    logoutMutation();
    useAuthStore.getState().logout();
    useUserStore.getState().clearUser();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface/70 px-4 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-foreground"
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>
        {tenantCode && (
          <span className="hidden md:inline-flex items-center rounded-lg border border-primary/20 bg-primary/8 px-3 py-1 text-[11px] font-medium tracking-wide text-primary">
            {tenantCode}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        <NotificationMenu />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-full p-0 hover:bg-transparent transition-all duration-300"
          >
            <Avatar className="size-10 rounded-full overflow-hidden">
              {user?.avatarFile?.url && (
                <AvatarImage
                  src={user.avatarFile?.url}
                  alt={user?.fullName ?? "User"}
                />
              )}
              <AvatarFallback className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="z-30 mt-2 min-w-[220px] rounded-2xl border border-border bg-surface p-1.5 shadow-[0_12px_40px_-12px_rgba(26,22,20,0.12)]"
          >
            <div className="px-3 py-2.5">
              <p className="text-sm font-medium">{user?.fullName ?? "User"}</p>
              <p className="text-xs text-foreground-muted">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="my-1 border-border" />
            <DropdownMenuItem
              onClick={() => router.push(portalPath("/profile"))}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground-muted hover:bg-surface-muted cursor-pointer outline-none transition-colors"
            >
              <User size={16} />
              <span>Hồ sơ cá nhân</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-accent-red-text hover:bg-accent-red/10 cursor-pointer outline-none transition-colors"
            >
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
