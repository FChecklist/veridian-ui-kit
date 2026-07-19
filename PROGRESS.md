# PROGRESS -- task-20260719-024156-veridian-ui-kit--extract-shared-appheade

## Completed
- [x] Read README.md and every file under src/shell/, src/composer/, src/panel/, src/context/ in full
- [x] Read compliance-tracker/veridian-scope-selector-in-home.html `<header>` block + `.icon-btn`/`.nav-item` CSS in full
- [x] Read compliance-tracker/src/components/AppTopbar.tsx in full
- [x] Checked ai-os/boss/ACTIVE-CLAIMS.yaml (compliance-tracker) and open PRs on FChecklist/veridian-ui-kit -- no conflicting claims/PRs found

## Remaining
- [ ] Build src/shell/AppHeader.tsx (generic layout + slot/callback props, per AppSidebar.tsx pattern)
- [ ] Add `.veri-icon-btn` (and any other needed) CSS to src/tokens/globals.css
- [ ] Export AppHeader from src/shell/index.ts
- [ ] Run `bunx tsc --noEmit` and fix issues
- [ ] Push branch, open PR against master
- [ ] Post AUDIT: PASS structured PR comment
- [ ] Check CI (gh run watch) -- note if none configured
- [ ] Self-merge (TIER1, squash + delete branch)
- [ ] Tag v0.2.0 and push tag
- [ ] Report final status: PR number, merged, new tag
