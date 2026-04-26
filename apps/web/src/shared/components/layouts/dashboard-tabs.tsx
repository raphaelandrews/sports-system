import {
  CalendarDaysIcon,
  CircleHelpIcon,
  HomeIcon,
  SearchIcon,
  ShieldIcon,
  TrophyIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import {
  Link,
  type RegisteredRouter,
  type useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@sports-system/ui/lib/utils";

type RouterRef = React.RefObject<ReturnType<typeof useRouter<RegisteredRouter>> | null>;

type TabType = "home" | "league" | "calendar" | "delegation" | "search" | "dashboard" | "generic";

type Tab = {
  id: string;
  url: string;
  title: string;
  type: TabType;
};

const STORAGE_KEY = "sports-system-dashboard-tabs";

const tabIconMap = {
  home: HomeIcon,
  league: TrophyIcon,
  calendar: CalendarDaysIcon,
  delegation: UsersIcon,
  search: SearchIcon,
  dashboard: ShieldIcon,
  generic: CircleHelpIcon,
} as const;

const pathLabels: Record<string, string> = {
  leagues: "Leagues",
  dashboard: "Dashboard",
  calendar: "Calendar",
  delegations: "Delegations",
  competitions: "Competitions",
  sports: "Sports",
  results: "Results",
  report: "Report",
  feed: "Feed",
  search: "Search",
  athletes: "Athletes",
  enrollments: "Enrollments",
  settings: "Settings",
  "my-delegation": "My delegation",
  invite: "Invite",
  transfers: "Transfers",
  members: "Members",
  narrative: "Narrative",
  "my-leagues": "My leagues",
  "request-chief": "Request chief",
  new: "New",
};

function readStoredTabs(): Tab[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Tab[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredTabs(tabs: Tab[]) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
}

function titleFromPath(pathname: string) {
  if (pathname === "/") return "Home";
  const segments = pathname.split("/").filter(Boolean);
  const last = segments.at(-1) ?? pathname;
  if (/^\d+$/.test(last)) {
    const prev = segments.at(-2);
    return prev ? `${pathLabels[prev] ?? prev} #${last}` : `#${last}`;
  }
  return pathLabels[last] ?? last.replace(/-/g, " ");
}

function typeFromPath(pathname: string): TabType {
  if (pathname === "/") return "home";
  if (pathname.includes("/search")) return "search";
  if (pathname.includes("/calendar")) return "calendar";
  if (pathname.includes("/deleg")) return "delegation";
  if (pathname.includes("/dashboard")) return "dashboard";
  if (pathname.includes("/leagues/")) return "league";
  return "generic";
}

function makeTab(pathname: string): Tab {
  return {
    id: pathname,
    url: pathname,
    title: titleFromPath(pathname),
    type: typeFromPath(pathname),
  };
}

function useScrollShadows(tabCount: number) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevTabCountRef = useRef(tabCount);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (tabCount > prevTabCountRef.current) {
      el.scrollLeft = el.scrollWidth;
    }
    prevTabCountRef.current = tabCount;
    updateScrollState();

    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tabCount, updateScrollState]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      const el = scrollRef.current;
      if (!el || el.scrollWidth <= el.clientWidth) return;
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
      updateScrollState();
    },
    [updateScrollState],
  );

  return {
    scrollRef,
    canScrollLeft,
    canScrollRight,
    updateScrollState,
    handleWheel,
  };
}

export function DashboardTabs({
  tabsReady,
  routerRef,
}: {
  tabsReady?: boolean;
  routerRef?: RouterRef;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const dragTabRef = useRef<string | null>(null);
  const { scrollRef, canScrollLeft, canScrollRight, updateScrollState, handleWheel } =
    useScrollShadows(openTabs.length);

  useEffect(() => {
    const stored = readStoredTabs();
    const current = makeTab(pathname);
    const next = stored.filter((tab) => tab.url !== pathname).concat(current);
    setOpenTabs(next);
    writeStoredTabs(next);
  }, [pathname]);

  const handleDragStart = useCallback((id: string) => {
    dragTabRef.current = id;
  }, []);

  const handleDragOver = useCallback((targetId: string) => {
    setOpenTabs((current) => {
      const dragId = dragTabRef.current;
      if (!dragId || dragId === targetId) return current;
      const fromIndex = current.findIndex((tab) => tab.id === dragId);
      const toIndex = current.findIndex((tab) => tab.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      writeStoredTabs(next);
      return next;
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    dragTabRef.current = null;
  }, []);

  const handleCloseTab = useCallback(
    (id: string, tabUrl: string) => {
      setOpenTabs((current) => {
        const index = current.findIndex((tab) => tab.id === id);
        const nextTab = index === -1 ? undefined : (current[index + 1] ?? current[index - 1]);
        const next = current.filter((tab) => tab.id !== id);
        writeStoredTabs(next);
        if (pathname === tabUrl) {
          void routerRef?.current?.navigate({ to: nextTab?.url ?? "/" });
        }
        return next;
      });
    },
    [pathname, routerRef],
  );

  if (openTabs.length === 0) return null;

  return (
    <div
      aria-hidden={!tabsReady}
      className={cn(
        "flex min-w-0 items-center gap-3 overflow-hidden transition-[opacity,transform] duration-300 ease-out",
        tabsReady ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-0.5 opacity-0",
      )}
    >
      <div className="hidden h-4 shrink-0 border-l border-border/50 md:block" />
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-linear-to-r from-muted to-transparent transition-opacity",
            canScrollLeft ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-linear-to-l from-muted to-transparent transition-opacity",
            canScrollRight ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          onWheel={handleWheel}
          onMouseEnter={updateScrollState}
          className="no-scrollbar flex w-0 min-w-full items-center gap-0.5 overflow-x-auto"
        >
          <ScrollActiveTabIntoView scrollRef={scrollRef} updateScrollState={updateScrollState} />
          {openTabs.map((tab) => {
            const Icon = tabIconMap[tab.type];
            return (
              <DetailTab
                key={tab.id}
                tab={tab}
                icon={Icon}
                onClose={handleCloseTab}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScrollActiveTabIntoView({
  scrollRef,
  updateScrollState,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  updateScrollState: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeTab = container.querySelector<HTMLElement>(".active");
    if (!activeTab) return;

    const { left: cLeft, right: cRight } = container.getBoundingClientRect();
    const { left: tLeft, right: tRight } = activeTab.getBoundingClientRect();

    if (tLeft < cLeft || tRight > cRight) {
      activeTab.scrollIntoView({ inline: "nearest", block: "nearest" });
      updateScrollState();
    }
  }, [pathname, scrollRef, updateScrollState]);

  return null;
}

const DetailTab = memo(function DetailTab({
  tab,
  icon: Icon,
  onClose,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  tab: Tab;
  icon: typeof HomeIcon;
  onClose: (id: string, tabUrl: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDragEnd: () => void;
}) {
  return (
    <Link
      to={tab.url}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart(tab.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver(tab.id);
      }}
      onDragEnd={onDragEnd}
      activeOptions={{ exact: true }}
      activeProps={{ className: "active" }}
      className="group relative hover:bg-surface-1! flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-surface-1 [&.active]:text-foreground"
    >
      <Icon size={13} strokeWidth={2} className="shrink-0" />
      <span className="max-w-32 truncate">{tab.title}</span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose(tab.id, tab.url);
        }}
        className="-mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-md md:hidden"
        aria-label={`Close ${tab.title}`}
      >
        <XIcon size={12} strokeWidth={2} className="text-muted-foreground" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose(tab.id, tab.url);
        }}
        className="absolute inset-y-0 right-0 hidden items-center rounded-r-md bg-surface-1 pl-1.5 pr-1.5 opacity-0 transition-opacity group-hover:opacity-100 md:flex"
        aria-label={`Close ${tab.title}`}
      >
        <span className="absolute inset-y-0 -left-3 w-3 bg-linear-to-r from-transparent to-surface-1" />
        <span className="relative flex size-4 items-center justify-center rounded-sm hover:bg-border/50">
          <XIcon size={10} strokeWidth={2} />
        </span>
      </button>
    </Link>
  );
});
