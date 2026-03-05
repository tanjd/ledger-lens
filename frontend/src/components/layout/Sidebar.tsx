"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBackendVersion } from "@/hooks/useStatement";
import {
  BarChart3,
  BookOpen,
  CreditCard,
  DollarSign,
  Home,
  LineChart,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: Home },
  { href: "/holdings", label: "Holdings", icon: BookOpen },
  { href: "/trades", label: "Trades", icon: CreditCard },
  { href: "/income", label: "Income", icon: DollarSign },
  { href: "/cashflows", label: "Cash Flows", icon: BarChart3 },
  { href: "/performance", label: "P&L Analysis", icon: TrendingUp },
  { href: "/trends", label: "Trends", icon: LineChart },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: backendVersion } = useBackendVersion();
  const frontendVersion = process.env.NEXT_PUBLIC_VERSION ?? "dev";

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          Ledger Lens
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3 space-y-0.5">
        <p className="text-xs text-muted-foreground">IBKR Portfolio Dashboard</p>
        <p className="text-xs text-muted-foreground/60">
          <span>ui v{frontendVersion}</span>
          <span className="mx-1">&middot;</span>
          <span>api v{backendVersion?.version ?? "–"}</span>
        </p>
      </div>
    </aside>
  );
}
