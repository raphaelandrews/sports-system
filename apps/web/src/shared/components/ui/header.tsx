import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, PlusCircle, Shield, UserCircle } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@sports-system/ui/components/avatar";
import { Button, buttonVariants } from "@sports-system/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sports-system/ui/components/dropdown-menu";
import { ScrollArea } from "@sports-system/ui/components/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@sports-system/ui/components/sheet";
import { cn } from "@sports-system/ui/lib/utils";
import { logoutFn } from "@/features/auth/server/auth";
import { AnimatedThemeToggler } from "@/shared/components/ui/animated-theme-toggler";
import type { Session } from "@/types/auth";

type HeaderProps = {
  session: Session | null;
};

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

const baseNavItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    match: (pathname) => pathname === "/",
  },
  {
    href: "/leagues",
    label: "Leagues",
    match: (pathname) => pathname === "/leagues" || pathname.startsWith("/leagues/"),
  },
];

const authenticatedNavItems: NavItem[] = [
  {
    href: "/my-leagues",
    label: "My leagues",
    match: (pathname) => pathname === "/my-leagues" || pathname.startsWith("/my-leagues/"),
  },
  {
    href: "/leagues/new",
    label: "Create league",
    match: (pathname) => pathname === "/leagues/new",
  },
];

function initialsFor(session: Session) {
  const displayName = session.name ?? session.email;
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function HeaderNav({
  items,
  pathname,
  className,
}: {
  items: NavItem[];
  pathname: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {items.map((item) => {
        const isActive = item.match(pathname);

        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-sm text-muted-foreground",
              isActive && "bg-muted text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function Header({ session }: HeaderProps) {
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navItems = session ? [...baseNavItems, ...authenticatedNavItems] : baseNavItems;

  async function handleLogout() {
    await logoutFn();
    await router.invalidate();
    await router.navigate({ to: "/login" });
    toast.success("Session ended");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="container flex h-14 items-center gap-2">
        <Link
          to="/"
          className="inline-flex items-center text-lg font-semibold tracking-tight text-foreground"
        >
          Sports
        </Link>

        <HeaderNav items={navItems} pathname={pathname} className="ml-4 hidden md:flex" />

        <div className="ml-auto flex items-center gap-2">
          <AnimatedThemeToggler variant="outline" size="icon-sm" />

          {!session ? (
            <>
              <Link
                to="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden md:inline-flex")}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "hidden md:inline-flex",
                )}
              >
                Register
              </Link>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden md:inline-flex"
                    aria-label="Open account menu"
                  />
                }
              >
                <Avatar size="sm">
                  <AvatarFallback>{initialsFor(session)}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{session.name ?? "Account"}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center gap-3 py-2">
                    <Avatar>
                      <AvatarFallback>{initialsFor(session)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {session.name ?? "Account"}
                      </span>
                      <span className="text-xs text-muted-foreground">{session.email}</span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem render={<a href="/my-leagues" />}>
                    <Shield />
                    My leagues
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<a href="/leagues/new" />}>
                    <PlusCircle />
                    Create league
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<a href="/request-chief" />}>
                    <UserCircle />
                    Request chief
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => void handleLogout()}>
                  <LogOut />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="md:hidden"
                  aria-label="Open navigation menu"
                />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent className="flex flex-col gap-0 p-0 md:hidden" side="right">
              <SheetHeader className="border-b px-4 py-4 text-left">
                <SheetTitle>Sports</SheetTitle>
                <SheetDescription>Navigation, account actions, and quick links.</SheetDescription>
              </SheetHeader>

              <ScrollArea className="h-[calc(100dvh-180px)] flex-1">
                <div className="flex flex-col gap-6 px-4 py-4">
                  <div className="flex flex-col gap-2">
                    {navItems.map((item) => {
                      const isActive = item.match(pathname);

                      return (
                        <SheetClose
                          key={item.href}
                          render={
                            <Link
                              to={item.href}
                              className={cn(
                                buttonVariants({ variant: "ghost", size: "default" }),
                                "justify-start",
                                isActive && "bg-muted text-foreground",
                              )}
                            />
                          }
                        >
                          {item.label}
                        </SheetClose>
                      );
                    })}
                  </div>

                  {session ? (
                    <div className="flex flex-col gap-2">
                      <div className="rounded-lg border bg-muted/40 px-3 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{initialsFor(session)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {session.name ?? "Account"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {session.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <SheetClose
                        render={
                          <Link
                            to="/my-leagues"
                            className={cn(buttonVariants({ variant: "ghost", size: "default" }), "justify-start")}
                          />
                        }
                      >
                        My leagues
                      </SheetClose>
                      <SheetClose
                        render={
                          <Link
                            to="/leagues/new"
                            className={cn(buttonVariants({ variant: "ghost", size: "default" }), "justify-start")}
                          />
                        }
                      >
                        Create league
                      </SheetClose>
                      <SheetClose
                        render={
                          <Link
                            to="/request-chief"
                            className={cn(buttonVariants({ variant: "ghost", size: "default" }), "justify-start")}
                          />
                        }
                      >
                        Request chief
                      </SheetClose>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <SheetClose
                        render={
                          <Link
                            to="/login"
                            className={cn(buttonVariants({ variant: "outline", size: "default" }), "justify-start")}
                          />
                        }
                      >
                        Login
                      </SheetClose>
                      <SheetClose
                        render={
                          <Link
                            to="/register"
                            className={cn(buttonVariants({ variant: "default", size: "default" }), "justify-start")}
                          />
                        }
                      >
                        Register
                      </SheetClose>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <SheetFooter className="border-t px-4 py-4">
                {session ? (
                  <SheetClose
                    render={<Button variant="destructive" className="w-full" onClick={() => void handleLogout()} />}
                  >
                    Logout
                  </SheetClose>
                ) : (
                  <SheetClose render={<Button variant="outline" className="w-full" />}>
                    Close
                  </SheetClose>
                )}
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
