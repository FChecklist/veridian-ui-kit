"use client";

// Generic list renderers for the panel's Overview/Tasks/Chats/To-Do tabs --
// each takes plain data + callbacks, matching the mockup's
// renderOverview()/renderTaskList()/renderChatListPanel()/renderTodoList().
// No product-specific fetching lives here; the consuming product's own
// panel wrapper fetches its own data (VERIDIAN's /api/tasks, PROJEXA's
// /api/assistant, etc.) and passes it in as these plain arrays.
import type { ReactNode } from "react";

export type OverviewItem = {
  id: string;
  type: string;
  title: string;
  sub?: string;
  unread?: boolean;
  onClick: () => void;
};

export type OverviewIconMap = Record<string, { bg: string; icon: ReactNode }>;

export function OverviewList({ items, icons, emptyText = "Nothing needs your attention right now." }: { items: OverviewItem[]; icons: OverviewIconMap; emptyText?: string }) {
  if (items.length === 0) {
    return <div className="px-5 py-10 text-center text-sm text-ct-muted">{emptyText}</div>;
  }
  return (
    <div>
      {items.map((item) => {
        const meta = icons[item.type];
        return (
          <button key={item.id} type="button" onClick={item.onClick} className="overview-item flex items-start gap-2.5 w-full text-left px-3.5 py-2.5 border-b border-ct-border/60 hover:bg-ct-cream transition-colors">
            {meta && (
              <div className="grid place-items-center size-[26px] rounded-lg shrink-0 text-white" style={{ background: meta.bg }}>
                {meta.icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-ct-navy truncate">{item.title}</p>
                {item.unread && <span className="size-2 rounded-full bg-ct-saffron shrink-0" />}
              </div>
              {item.sub && <p className="text-[12px] text-ct-muted truncate mt-0.5">{item.sub}</p>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export type StatusMeta = { label: string; dotClassName: string; textClassName: string };

export type TaskListItem = {
  id: string;
  title: string;
  sub?: string;
  status: string;
  onClick: () => void;
  onMarkDone?: () => void;
};

export function TaskList({ items, statusMeta, emptyText = "No tasks given to your assistant yet." }: { items: TaskListItem[]; statusMeta: Record<string, StatusMeta>; emptyText?: string }) {
  if (items.length === 0) {
    return <div className="px-5 py-10 text-center text-sm text-ct-muted">{emptyText}</div>;
  }
  return (
    <div>
      {items.map((item) => {
        const meta = statusMeta[item.status] ?? { label: item.status, dotClassName: "bg-ct-muted", textClassName: "text-ct-muted" };
        return (
          <button key={item.id} type="button" onClick={item.onClick} className="block w-full text-left px-3.5 py-2.5 border-b border-ct-border/60 hover:bg-ct-cream transition-colors">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-ct-navy truncate flex-1">{item.title}</span>
              <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] ${meta.textClassName}`}>
                <span className={`size-[7px] rounded-full inline-block ${meta.dotClassName}`} />
                {meta.label}
              </span>
              {item.onMarkDone && item.status !== "completed" && item.status !== "done" && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); item.onMarkDone?.(); }}
                  title="Mark done"
                  className="grid place-items-center size-5 rounded-full border border-ct-border2 text-ct-muted hover:border-emerald-500 hover:text-emerald-600 transition-colors shrink-0"
                >
                  ✓
                </button>
              )}
            </div>
            {item.sub && <p className="truncate text-xs text-ct-muted mt-0.5">{item.sub}</p>}
          </button>
        );
      })}
    </div>
  );
}

export type ChatListItem = { id: string; name: string; initials: string; lastMessage?: string; unread?: boolean; onClick: () => void };

export function ChatList({ items, emptyText = "No conversations yet." }: { items: ChatListItem[]; emptyText?: string }) {
  if (items.length === 0) {
    return <div className="px-5 py-10 text-center text-sm text-ct-muted">{emptyText}</div>;
  }
  return (
    <div>
      {items.map((c) => (
        <button key={c.id} type="button" onClick={c.onClick} className="flex items-start gap-3 px-4 py-3 border-b border-ct-border/60 w-full text-left hover:bg-ct-cream transition-colors">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-ct-navy text-white text-xs font-bold">{c.initials}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[13px] font-semibold text-ct-navy">{c.name}</p>
              {c.unread && <span className="size-2 rounded-full bg-ct-saffron shrink-0" />}
            </div>
            <p className="truncate text-xs text-ct-muted mt-0.5">{c.lastMessage ?? "No messages yet"}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export type TodoListItem = { id: string; text: string; done: boolean };

export function TodoList({ items, onToggle, onAdd, emptyText = "Nothing on your to-do list." }: { items: TodoListItem[]; onToggle: (id: string, done: boolean) => void; onAdd?: (text: string) => void; emptyText?: string }) {
  return (
    <div>
      {items.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-ct-muted">{emptyText}</div>
      ) : (
        items.map((d) => (
          <label key={d.id} className="flex items-center gap-3 px-4 py-3 border-b border-ct-border/60 cursor-pointer">
            <input
              type="checkbox"
              checked={d.done}
              onChange={(e) => onToggle(d.id, e.target.checked)}
              style={{ width: 15, height: 15, accentColor: "var(--color-ct-teal)", flexShrink: 0 }}
            />
            <span className={`text-[13px] ${d.done ? "text-ct-muted line-through" : "text-ct-navy"}`}>{d.text}</span>
          </label>
        ))
      )}
      {onAdd && <TodoQuickAddInline onAdd={onAdd} />}
    </div>
  );
}

function TodoQuickAddInline({ onAdd }: { onAdd: (text: string) => void }) {
  return (
    <div className="px-4 py-3">
      <input
        type="text"
        placeholder="Add a to-do…"
        className="w-full rounded-lg border border-ct-border bg-white px-2.5 py-1.5 text-[13px] text-ct-navy placeholder:text-ct-muted focus:outline-none focus:ring-2 focus:ring-ct-navy/20"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const v = e.currentTarget.value.trim();
            if (v) { onAdd(v); e.currentTarget.value = ""; }
          }
        }}
      />
    </div>
  );
}
