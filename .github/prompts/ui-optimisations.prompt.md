# Fluxby UI/UX Optimization Master Plan (Lead Developer Edition)

This plan provides technical specifications for modernizing the Fluxby app. It addresses common architectural pitfalls, specifically answering typical junior dev ambiguities regarding state, testing, and component organization.

---

## 🏗️ Phase 1: Architectural Strategy & Feature Extraction
**Goal**: Deconstruct monolithic views into a feature-based architecture with clear boundaries between UI, logic, and state.

### 1.1 Technical Standards
- **Folder Naming**: Use **kebab-case** for directories (e.g., `src/features/transactions-list/`). Use **PascalCase** for component files (`TransactionRow.tsx`).
- **Types Strategy**: Always import types from **`@fluxby/shared`**. Avoid local `types.ts` files within features unless the type is strictly internal to one component.
- **State Pattern**: 
  - **Smart Components**: Feature-level components (e.g., `TransactionFilters`) should consume Context (`FilterContext`) directly.
  - **Presentational Components**: Leaf components should receive data via **Props** to remain pure and testable.
- **Communication**: Use **URL search parameters** (`useSearchParams`) as the primary source of truth for view filters. This ensures "Deep Linking" and allows effortless shard state between disparate components (e.g., Chart -> List).
- **Hook Dependencies**: Extracted hooks (e.g., `use-transaction-filters`) should be **self-contained**. They should fetch their own context rather than requiring values to be passed in, making them easier to drop into any component.

### 1.2 Feature Extraction Map (Priority: `Transactions.tsx`)
1. Create `src/features/transactions/`. 
2. **`hooks/use-transaction-filters.ts`**: Centralize `useFilters` and `useSearchParams` logic.
3. **`components/filter-bar/`**: Extract filter UI. Consumer of `use-transaction-filters`.
4. **`components/data-table/`**: Extract the `IntersectionObserver` list rendering. Receives `transactions` as props.
5. **`forms/`**: Extract logic into standalone components (e.g., `CategorizeForm.tsx`). These are decoupled from modals/drawers.

---

## 🎨 Phase 2: Design System & Visual Rigor
**Goal**: Implement a "Premium Glassmorphism" system using Tailwind v4 variable-driven themes.

### 2.1 Core Tokens & Global CSS
Add the following to the `@theme` block in `src/index.css`.
- **Component Placement**: New shared primitives like **`GlassCard`** belong in **`src/components/ui/`**.
- **Animation Strategy**: For the "active scale" effect, define a global utility class `.btn-active-scale` in `index.css` rather than a CVA variant to keep the Button component logic lean.
- **Typography Scope**: Use a scoped utility class `.tabular-nums` rather than a global setting to avoid unintended line-height or font-spacing issues in prose text.

```css
/* Glassmorphism Primitives */
--glass-bg: hsl(var(--card) / 0.6);
--glass-border: hsl(var(--border) / 0.4);
--glass-blur: blur(12px);
--glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);

/* Interactive Glows */
--primary-glow: 0 0 20px -5px hsl(var(--primary) / 0.3);
```

---

## 📱 Phase 3: View-Specific Implementation
**Goal**: Pixel-perfect functional enhancements.

- **Chart-to-List Communication**: When a user clicks a Pie slice, the component should update the URL via `setSearchParams`. The `TransactionList` hook automatically listens for these changes and refreshes data.
- **Anomaly Logic**: Use the existing `dataService.getMonthlyStats()` logic to compute anomalies in the frontend (e.g., comparing current month to a 3-month rolling average) before the backend implements a dedicated endpoint.
- **Merchant Suggestions**: Use the `@radix-ui/react-popover` for a non-blocking merchant search that filters against the local `AddressBook` hook.

---

## ♿ Phase 4: UX & Resilient Patterns
**Goal**: Accessibility and graceful degradation.

- **Responsive Implementation**: 
  - Create a single **`SubscriptionForm.tsx`** (the content).
  - Wrap it in `<Dialog />` (Desktop) or `<Drawer />` (Mobile) based on a `useMediaQuery` hook. **Composition over duplication.**
- **Error Boundaries**: Wrap **individual Cards** or Charts separately. If the "Income Trend" chart fails, the "Cash Flow" summary should remain functional.
- **Keyboard A11y**: Every interactive Lucide icon must have an `aria-label`. Use `sr-only` text if the icon has no visible companion text.

---

## 🚀 Phase 5: Testing & Quality Gates
**Goal**: 100% confidence in refactored code.

- **File Placement**: Follow the pattern of **`__tests__`** folders local to the feature (e.g., `src/features/transactions/__tests__/Filters.test.tsx`).
- **Mocking Strategy**: 
  - Use **`msw`** (Mock Service Worker) for API layer mocking. 
  - Wrap tests in a **`TestProvider`** (found in `tests/test-helpers.ts`) which provides the mock `QueryClient` and `FilterContext`.
- **Regression Check**: Every refactored view must be verified against the `Privacy Mode` toggle to ensure all new elements (labels/axes) are covered by the `.privacy-blur` filter.

---
> [!IMPORTANT]
> A lead developer reviews for **composition over inheritance**. Ensure components are small (max 200 lines) and hooks are narrowly focused on a single domain (Filters, Data, or Actions).
