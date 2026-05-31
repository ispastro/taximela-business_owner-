"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/features/owner/components/theme-toggle";
import { useOwnerAccount } from "@/features/owner/hooks/use-owner-account";
import { signOutUser } from "@/lib/firebase";
import { canAccessDashboard } from "@/lib/owner-account";
import { useSessionStore } from "@/store/session-store";

type ShellWidth = "narrow" | "medium" | "default" | "wide";

const widthClass: Record<ShellWidth, string> = {
  narrow:  "tx-main-narrow",
  medium:  "tx-main-medium",
  default: "tx-main-default",
  wide:    "tx-main-wide",
};

function navIsActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/businesses/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function OwnerAppShell({
  children,
  width = "default",
}: {
  children: React.ReactNode;
  width?: ShellWidth;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const clearSession = useSessionStore((s) => s.clearSession);
  const { data: accountState } = useOwnerAccount();
  const showDashboard = accountState ? canAccessDashboard(accountState) : false;
  const showNewApplication = pathname !== "/registration";

  async function handleSignOut() {
    await signOutUser();
    clearSession();
    router.replace("/login");
  }

  const navItems = [
    ...(showDashboard
      ? [{ href: "/dashboard", label: "Dashboard" }]
      : []),
    { href: "/status", label: "Applications" },
  ];

  return (
    <div className="tx-app-shell">
      <header className="tx-topbar">
        <div className="tx-topbar-inner">
          <Link href={showDashboard ? "/dashboard" : "/status"} className="tx-brand-mark">
            Taximela<span>.</span>
          </Link>

          <nav className="tx-nav" aria-label="Owner portal">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  navIsActive(pathname, item.href)
                    ? "tx-nav-link tx-nav-link-active"
                    : "tx-nav-link"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="tx-topbar-actions">
            <ThemeToggle />
            {showNewApplication && (
              <Link href="/registration" className="tx-btn-primary">
                New Application
              </Link>
            )}
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="tx-btn-ghost"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className={`tx-main ${widthClass[width]}`}>{children}</main>
    </div>
  );
}
