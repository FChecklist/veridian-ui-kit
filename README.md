# @fchecklist/veridian-ui-kit

The shared VERIDIAN AI OS UI/UX shell — design tokens, the collapsible/
resizable app shell, the persistent bottom composer (mode pills → chain
selector → send/queue), and the collapsible right "assistant chat" panel.
Consumed by VERIDIAN AI OS (compliance-tracker), PROJEXA, and any future
FChecklist product, so they never drift into separate re-implementations
again — the exact problem that produced PROJEXA's original independent
`px-*` theme and 2x-smaller port of these components.

Reference implementation this was extracted from: VERIDIAN AI OS's real,
live `AppShell.tsx` / `AppSidebar.tsx` / `VeriComposer.tsx` /
`VeriChatPanel.tsx` / `veri-chat-context.tsx` (compliance-tracker repo).
Visual/behavioral source of truth: `compliance-tracker/veridian-scope-selector-in-home.html`.

## Scope boundary — read this before extending

This package owns the **shell** — colors, fonts, layout mechanics, the
composer/chain-selector/panel interaction pattern, and the merged-Home-page
behavior. It deliberately does **not** own:

- Any product's real business data or capability-tree content (VERIDIAN's
  finance/compliance/HR actions vs PROJEXA's construction actions).
- The real task-dispatch backend (`dispatchTool()`, `worker_agents`, VCEL
  engines) — that's VERIDIAN-side infrastructure, not a UI concern.
- VERIDIAN's more advanced, product-specific real features not shown in the
  reference mockup — the high-impact-action confirmation dialog, FDE
  "capability not available" fallback, multi-thread AI conversation
  switching, VCEL calculator input fields, Meetings/Approvals/Voice panel
  tabs. Every place this package would otherwise need to know about one of
  these, it exposes a callback instead (`onDispatch`, `onSendMessage`) so
  the consuming product wraps its own real logic around it.

If a change would make this package aware of one specific product's
business rules, it belongs in that product's own wrapper code, not here.

## Install

Each consuming app's `package.json`:

```json
"@fchecklist/veridian-ui-kit": "github:FChecklist/veridian-ui-kit#v0.1.0"
```

## Exports

- `@fchecklist/veridian-ui-kit/tokens/globals.css` — `@import` this into
  your app's own `globals.css`.
- `@fchecklist/veridian-ui-kit/tokens/fonts` — `veridianHeadingFont` (DM
  Serif Display) / `veridianSansFont` (Inter), for your root `layout.tsx`.
- `@fchecklist/veridian-ui-kit/context` — `createVeriChatContext()`, the
  shared two-axis (`composerMode` / `activeView`) state-machine factory.
- `@fchecklist/veridian-ui-kit/shell` — `AppShellFrame`, `AppSidebar`,
  `AppHeader`, `HomeGreeting`.
- `@fchecklist/veridian-ui-kit/composer` — `VeriComposer`, `ChainRows` and
  its path-display helpers.
- `@fchecklist/veridian-ui-kit/panel` — `PanelShell`, `OverviewList`,
  `TaskList`, `ChatList`, `TodoList`, `ThreadView`.

## Adoption recipe

1. `globals.css`: `@import "@fchecklist/veridian-ui-kit/tokens/globals.css";`
   before your own Tailwind `@theme` overrides (if any — there shouldn't be
   any for `ct-*`/`scope-tint`, add new tokens here instead of shadowing).
2. Root `layout.tsx`: load `veridianHeadingFont`/`veridianSansFont`, apply
   their `.variable` classes to `<html>`.
3. Build your own `veri-chat-context.tsx` calling `createVeriChatContext()`
   with your product's own `fetchTree` implementation (your real
   `/api/capability-tree` call).
4. Build your own thin `AppSidebar` nav-item list (your product's real
   pages) and pass it into `AppShellFrame`'s `sidebar` slot alongside your
   own `VeriComposer`/panel wiring (your real `/api/tasks`-equivalent calls
   wrapped around this package's `onDispatch`/`onSendMessage` callbacks).
5. Pick your `homeRoute` (VERIDIAN: `/home`, PROJEXA: `/dashboard`) and
   build a `HomeGreeting` + `ThreadView` for `AppShellFrame`'s
   `homeThreadSlot`.

See `compliance-tracker`'s and `projexa`'s own shell code (post-migration)
for a complete worked example of steps 3–5.
