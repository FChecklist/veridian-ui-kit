// R62 B7 regression test for R55_PERMITS_ROW_KEYBOARD_UNREACHABLE_01.
//
// Original defect (found live at /permits, PROJEXA, R55 17-screen demo-path
// walk): the clickable list row was a bare `<tr onClick>` with tabIndex=-1,
// no ARIA role, and no onKeyDown handler. Sort-header buttons were reachable
// by Tab but the data row that opens a record's detail was not in the tab
// order at all -- a keyboard-only user had NO way to open a row from the
// list, even though a real mouse click worked fine.
//
// Fixed in github:FChecklist/veridian-ui-kit#4ad3bad4 / PR #26 (squash SHA
// 2bbddadd6f) by giving the row, when `onRowClick` is supplied,
// tabIndex={0}, role="button", and an onKeyDown handler that fires
// onRowClick on Enter or Space (src/screens/ListScreen.tsx:173-187).
//
// This is a real behavioural regression test, not a static class/attribute
// check: it renders the actual exported ListScreen component, focuses the
// row exactly as a keyboard-only user's Tab press would, and fires the same
// KeyboardEvents a browser fires for Enter/Space -- asserting the callback
// the whole feature exists to invoke is actually reached.
import { GlobalRegistrator } from "@happy-dom/global-registrator";
// bun test runs every *.test.ts(x) file in the SAME process. Registering
// happy-dom twice throws ("Failed to register. Happy DOM has already been
// globally registered."), so only register if nothing has installed a DOM
// yet -- this mirrors the guard PROJEXA's own React test suites use for the
// identical reason (see e.g. projexa/src/components/PayrollClient.test.tsx).
if (typeof globalThis.document === "undefined") GlobalRegistrator.register();

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
// NOTE: deliberately using each render()'s own bound query helpers, not the
// `@testing-library/react` global `screen` singleton -- `screen` resolves
// `document` at call time via a reference captured before
// GlobalRegistrator.register() runs above, and throws "a global document has
// to be available" even though happy-dom is in fact registered by then (see
// PROJEXA's src/components/ui/form-field.test.tsx for the same workaround).

// Dynamically imported (not a static top-level import): ListScreen pulls in
// React itself, and some of its effects/refs assume a real `document`
// exists at module-evaluation time. A static import would be hoisted above
// the GlobalRegistrator.register() call above; a dynamic import here
// defers evaluation until after `document` is guaranteed to exist -- same
// reasoning PROJEXA's suites document for their Radix-based components.
const { ListScreen } = await import("./ListScreen");
const { EMPTY_VALUE_DISPLAY: _unused } = await import("./types");
void _unused;

afterEach(() => {
  cleanup();
});

type Row = { id: string; name: string };

const ROWS: Row[] = [
  { id: "permit-1", name: "Fire Safety Permit" },
  { id: "permit-2", name: "Excavation Permit" },
];

const COLUMNS = [
  { field: "name", label: "Name", type: "text", importance: "high" as const },
];

function renderList(onRowClick: (row: Row) => void) {
  return render(
    <ListScreen<Row>
      functionId="test.permits.list"
      columns={COLUMNS as never}
      rows={ROWS}
      getRowId={(row) => row.id}
      onRowClick={onRowClick}
    />
  );
}

describe("R55_PERMITS_ROW_KEYBOARD_UNREACHABLE_01 regression", () => {
  test("a clickable row is in the tab order and exposes a button role", () => {
    const { getByText } = renderList(() => {});
    const row = getByText("Fire Safety Permit").closest("tr")!;
    // The original defect: tabIndex=-1 (or absent), role=null. A
    // keyboard-only user's Tab key skips any element with tabIndex < 0.
    expect(row.getAttribute("tabindex")).toBe("0");
    expect(row.getAttribute("role")).toBe("button");
  });

  test("pressing Enter on a focused row invokes onRowClick with that row", () => {
    const clicked: Row[] = [];
    const { getByText } = renderList((row) => clicked.push(row));
    const row = getByText("Fire Safety Permit").closest("tr")!;

    row.focus();
    fireEvent.keyDown(row, { key: "Enter" });

    expect(clicked).toHaveLength(1);
    expect(clicked[0].id).toBe("permit-1");
  });

  test("pressing Space on a focused row invokes onRowClick with that row", () => {
    const clicked: Row[] = [];
    const { getByText } = renderList((row) => clicked.push(row));
    const row = getByText("Excavation Permit").closest("tr")!;

    row.focus();
    fireEvent.keyDown(row, { key: " " });

    expect(clicked).toHaveLength(1);
    expect(clicked[0].id).toBe("permit-2");
  });

  test("a row with no onRowClick stays out of the tab order (no false-positive accessibility)", () => {
    const { getByText } = render(
      <ListScreen<Row>
        functionId="test.permits.list.readonly"
        columns={COLUMNS as never}
        rows={ROWS}
        getRowId={(row) => row.id}
      />
    );
    const row = getByText("Fire Safety Permit").closest("tr")!;
    expect(row.getAttribute("tabindex")).toBeNull();
    expect(row.getAttribute("role")).toBeNull();
  });
});
