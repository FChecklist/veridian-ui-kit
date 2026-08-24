"use client";

// R42 seq24 -- the SAP "link list" pattern DASHBOARD.GLOBAL names
// explicitly: "Quick actions" -- each entry is a function_id, so it opens
// the real screen, never a popup.
export type LinkListItem = { label: string; onClick: () => void };

export function LinkListCard({ title, items }: { title: string; items: LinkListItem[] }) {
  return (
    <div className="rounded-md border border-ct-border p-3">
      <h3 className="text-[13px] font-medium text-ct-navy mb-2">{title}</h3>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.label}>
            <button type="button" onClick={item.onClick} className="text-[12.5px] text-ct-teal hover:underline">
              {item.label} →
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
