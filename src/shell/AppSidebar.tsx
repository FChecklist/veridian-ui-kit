"use client";

// Generic collapsible/resizable sidebar -- renders whatever nav item list
// the product supplies (VERIDIAN's Finance/Compliance/HR groups, PROJEXA's
// Execution/Field/Design/Resources/Sales/GRC/Finance/HR/Intelligence
// groups), styled exactly per the mockup's #leftSidebar/.nav-item rules.
// The product owns its own real nav DATA; this owns the shared shell only.
import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useResizableWidth } from "./useResizable";

export type NavItem = { href: string; label: string; icon?: ReactNode; badge?: ReactNode };
export type NavSection = { label?: string; items: NavItem[] };

export type AppSidebarProps = {
  sections: NavSection[];
  logo?: ReactNode;
  productName?: string;
  collapsed: boolean;
};

export function AppSidebar({ sections, logo, productName = "VERIDIAN AI", collapsed }: AppSidebarProps) {
  const pathname = usePathname();
  // Real 3-screen proportion (Owner directive): sidebar ~10% / main ~50% /
  // right panel ~40% of the viewport. Existing 140-320px bounds unchanged --
  // only the starting/default width now targets a true percentage instead
  // of a fixed 220px guess.
  const { width, onHandleMouseDown } = useResizableWidth(220, 140, 320, "left", () => Math.round(window.innerWidth * 0.1));

  if (collapsed) return null;

  return (
    <>
      <aside style={{ width }} className="shrink-0 border-r border-ct-border bg-white flex flex-col overflow-y-auto">
        <div className="flex items-center gap-2 px-3 pt-3.5 pb-2">
          {logo ?? <div className="grid size-7 place-items-center rounded-lg bg-ct-navy text-white text-xs font-bold">{productName.charAt(0)}</div>}
          <span className="font-heading text-[15px] text-ct-navy tracking-tight truncate">{productName}</span>
        </div>
        <nav className="flex-1 px-2.5 pb-4">
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.label && (
                <p className="px-3 mb-1 mt-4 text-[9px] font-bold tracking-widest text-ct-muted uppercase">{section.label}</p>
              )}
              {section.items.map((item, iIdx) => {
                const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href + "/"));
                // Keyed by href+label+index, not href alone -- a consuming
                // product's real nav legitimately has multiple distinct
                // items pointing at the same href (e.g. two different
                // entry points into the same list page, filtered
                // differently client-side), confirmed while adopting this
                // component in compliance-tracker's real migration
                // (2026-07-19): href-only keys collided and produced a real
                // React "duplicate key" warning.
                return (
                  <Link key={`${item.href}-${item.label}-${iIdx}`} href={item.href} className={`veri-nav-item${active ? " active" : ""}`}>
                    {item.icon}
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <div onMouseDown={onHandleMouseDown} className="w-[5px] cursor-col-resize shrink-0 hover:bg-ct-saffron/25" />
    </>
  );
}
