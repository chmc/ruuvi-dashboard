# NPM Package Upgrade Plan (TDD Approach)

This document outlines a step-by-step plan to upgrade all npm packages to their latest versions, handling breaking changes correctly.

## Current State vs Target State

| Package                   | Current | Target | Breaking Changes          |
| ------------------------- | ------- | ------ | ------------------------- |
| @mui/material             | 5.18.0  | 7.3.6 ✅ | Major (v5→v6→v7)          |
| @mui/icons-material       | 5.18.0  | 7.3.6 ✅ | Major                     |
| eslint                    | 8.57.1  | 9.x    | Major (flat config)       |
| prettier                  | 2.8.8   | 3.x    | Major (ESM, async API)    |
| eslint-plugin-prettier    | 4.2.5   | 5.x    | Major (Prettier 3 compat) |
| eslint-config-prettier    | 9.1.2   | 10.x   | Minor                     |
| eslint-plugin-react-hooks | 4.6.2   | 7.x    | Major                     |

## Upgrade Strategy

Upgrades are grouped by dependency relationships and risk level. Each task is atomic and testable.

---

## Phase 1: Prettier + ESLint Ecosystem (Low Risk) ✅ COMPLETED

### Task 1.1: Upgrade Prettier 2 → 3 ✅

**Risk:** Medium
**Breaking Changes:**

- ESM-first (but CJS still works)
- Some formatting behavior changes
- `trailingComma: "es5"` still valid

**Steps:**

1. Update `prettier` to `^3.7.4`
2. Run `pnpm install`
3. Run `pnpm lint` to verify formatting still works
4. Run `pnpm test` to ensure tests pass
5. Check if any files need reformatting with `npx prettier --check .`

**Verification:**

```bash
pnpm test && pnpm lint
```

---

### Task 1.2: Upgrade eslint-plugin-prettier 4 → 5 ✅

**Risk:** Low
**Dependency:** Requires Prettier 3 (Task 1.1)
**Breaking Changes:**

- Required for Prettier 3 compatibility
- Drops Node.js < 14 support

**Steps:**

1. Update `eslint-plugin-prettier` to `^5.5.4`
2. Run `pnpm install`
3. Run `pnpm lint`
4. Run `pnpm test`

**Verification:**

```bash
pnpm test && pnpm lint
```

---

### Task 1.3: Upgrade eslint-config-prettier 9 → 10 ✅

**Risk:** Low
**Breaking Changes:**

- Minor config updates

**Steps:**

1. Update `eslint-config-prettier` to `^10.1.8`
2. Run `pnpm install`
3. Run `pnpm lint`
4. Run `pnpm test`

**Verification:**

```bash
pnpm test && pnpm lint
```

---

## Phase 2: ESLint 8 → 9 Migration (High Risk) ✅ COMPLETED

### Task 2.1: Migrate ESLint to Flat Config ✅

**Risk:** High
**Breaking Changes:**

- `.eslintrc.json` → `eslint.config.js` (flat config)
- Node.js 18.18+ required
- `parserOptions` → `languageOptions`
- Plugins loaded as JS objects
- No merging from ancestor directories

**Resources:**

- [ESLint Migration Guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [Flat Config Migration](https://eslint.org/docs/latest/use/configure/migration-guide)

**Steps:**

1. Create new `eslint.config.js` with flat config format
2. Migrate current `.eslintrc.json` rules to flat config
3. Update all eslint plugins to latest versions:
   - `eslint` → `^9.39.1`
   - `eslint-plugin-react` → `^7.37.5` (already latest)
   - `eslint-plugin-react-hooks` → `^5.2.0` or latest compatible
   - `eslint-plugin-import` → `^2.32.0` (already latest)
   - `eslint-plugin-jsx-a11y` → `^6.10.2` (already latest)
   - `eslint-plugin-jest` → `^29.2.1` (already latest)
4. Remove old `.eslintrc.json`
5. Update `package.json` lint script if needed
6. Run `pnpm lint` to verify
7. Run `pnpm test` to ensure tests pass

**New eslint.config.js structure:**

```javascript
import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-plugin-prettier'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import jest from 'eslint-plugin-jest'
import globals from 'globals'

export default [
  js.configs.recommended,
  // ... rest of config
]
```

**Verification:**

```bash
pnpm lint && pnpm test
```

---

### Task 2.2: Update eslint-plugin-react-hooks ✅

**Risk:** Medium
**Dependency:** Requires ESLint 9 (Task 2.1)
**Breaking Changes:**

- Version 5+ required for ESLint 9

**Steps:**

1. Update `eslint-plugin-react-hooks` to latest compatible version
2. Update eslint.config.js if needed
3. Run `pnpm lint`
4. Run `pnpm test`

**Verification:**

```bash
pnpm lint && pnpm test
```

---

## Phase 3: Material UI v5 → v7 (High Risk) ✅ COMPLETED

### Task 3.1: Audit MUI Component Usage ✅

**Risk:** None (audit only)
**Purpose:** Identify all MUI components and patterns used before upgrade

**Steps:**

1. List all MUI imports in the codebase
2. Check for deprecated APIs that will be removed:
   - `createMuiTheme` (use `createTheme`)
   - `experimentalStyled` (use `styled`)
   - `onBackdropClick` prop on Dialog/Modal
   - Deep imports like `@mui/material/styles/createTheme`
3. Document findings for upgrade

**Verification:**

```bash
grep -r "@mui" src/ --include="*.js" --include="*.jsx" | head -50
```

---

### Task 3.2: Upgrade MUI v5 → v6 ✅

**Risk:** Medium
**Breaking Changes (v5→v6):**

- React 18+ required (we have React 19, OK)
- Some deprecated APIs removed
- Slot API standardization begins

**Steps:**

1. Update packages:
   - `@mui/material` → `^6.x`
   - `@mui/icons-material` → `^6.x`
2. Run `pnpm install`
3. Fix any import errors (deep imports)
4. Run `pnpm test`
5. Run `pnpm lint`
6. Manually verify UI in browser

**Verification:**

```bash
pnpm test && pnpm lint && pnpm build
```

---

### Task 3.3: Upgrade MUI v6 → v7 ✅

**Risk:** Medium
**Breaking Changes (v6→v7):**

- Package layout uses Node.js exports field
- Deep imports (>1 level) removed entirely
- Modern bundles removed
- Slots API standardized
- CSS layers support (opt-in)

**Steps:**

1. Update packages:
   - `@mui/material` → `^7.3.6`
   - `@mui/icons-material` → `^7.3.6`
2. Run `pnpm install`
3. Fix any deep import errors:
   ```diff
   - import createTheme from '@mui/material/styles/createTheme'
   + import { createTheme } from '@mui/material/styles'
   ```
4. Run `pnpm test`
5. Run `pnpm lint`
6. Run `pnpm build`
7. Manually verify UI in browser

**Verification:**

```bash
pnpm test && pnpm lint && pnpm build
```

---

### Task 3.4: Update Theme Configuration (if needed) ✅

**Risk:** Low
**Purpose:** Ensure theme augmentation works with MUI v7

**Steps:**

1. Check `src/theme.js` for any deprecated patterns
2. Update TypeScript module declarations if using theme augmentation
3. Run `pnpm test`
4. Run `pnpm build`

**Verification:**

```bash
pnpm test && pnpm build
```

---

## Phase 4: Final Verification

### Task 4.1: Full Integration Test

**Risk:** None
**Purpose:** Verify everything works together

**Steps:**

1. Run full test suite: `pnpm test`
2. Run linter: `pnpm lint`
3. Build production: `pnpm build`
4. Start development: `pnpm start`
5. Manually test all features in browser:
   - RuuviTag sensor cards display correctly
   - Energy prices chart works
   - Weather forecast displays
   - Responsive layout works
   - Toggle buttons function

**Verification:**

```bash
pnpm test && pnpm lint && pnpm build
```

---

### Task 4.2: Clean Up

**Risk:** None

**Steps:**

1. Remove any deprecated code or workarounds
2. Update documentation if needed
3. Run `pnpm audit` to check for security issues
4. Final commit

---

## Rollback Plan

If any task fails and cannot be fixed:

1. **Git reset:** `git checkout -- .` to discard changes
2. **Restore node_modules:** `rm -rf node_modules && pnpm install`
3. **Partial rollback:** Revert specific package versions in package.json

---

## Task Execution Workflow

For each task:

1. **Mark task as in progress** - Update Progress Tracking with `[-]` prefix
2. **Read this plan** - Understand the task requirements
3. **Implement changes** - Make the code/config changes
4. **Run tests** - Execute `pnpm test`
5. **Run lint** - Execute `pnpm lint`
6. **Manual verification** - If UI changes, verify in browser
7. **User verification** - Ask user to verify
8. **Commit** - Either user commits or ask Claude to commit
9. **Mark task as completed** - Update Progress Tracking with `[x]` prefix
10. **Next task** - Move to the next task

### Progress Tracking Rules

- `[ ]` = Not started (pending)
- `[-]` = In progress (currently being worked on)
- `[x]` = Completed (after implementation AND verification)

**Important:** Tasks must only be marked as completed AFTER implementation and successful verification (tests pass, lint passes). Never mark tasks complete before doing the work.

---

## Progress Tracking

- [x] **Task 1.1:** Upgrade Prettier 2 → 3 ✅ (2.8.8 → 3.7.4)
- [x] **Task 1.2:** Upgrade eslint-plugin-prettier 4 → 5 ✅ (4.2.5 → 5.5.4)
- [x] **Task 1.3:** Upgrade eslint-config-prettier 9 → 10 ✅ (9.1.2 → 10.1.8)
- [x] **Task 2.1:** Migrate ESLint to Flat Config + ESLint 9 ✅ (8.57.1 → 9.x)
- [x] **Task 2.2:** Update eslint-plugin-react-hooks ✅ (4.6.2 → 5.x)
- [x] **Task 3.1:** Audit MUI Component Usage ✅ (No deprecated APIs, imports ready for v7)
- [x] **Task 3.2:** Upgrade MUI v5 → v6 ✅ (5.18.0 → 6.5.0)
- [x] **Task 3.3:** Upgrade MUI v6 → v7 ✅ (6.5.0 → 7.3.6, Grid v2 migration)
- [x] **Task 3.4:** Update Theme Configuration (if needed) ✅ (No changes needed)
- [x] **Task 4.1:** Full Integration Test ✅ (All 182 tests pass, lint passes, build succeeds)
- [x] **Task 4.2:** Clean Up ✅ (No cleanup needed)

---

## References

- [MUI v7 Migration Guide](https://mui.com/material-ui/migration/upgrade-to-v7/)
- [MUI v7 Release Blog](https://mui.com/blog/material-ui-v7-is-here/)
- [ESLint v9 Migration Guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [ESLint Flat Config Migration](https://eslint.org/docs/latest/use/configure/migration-guide)
- [Prettier 3.0 Release](https://prettier.io/blog/2023/07/05/3.0.0.html)
