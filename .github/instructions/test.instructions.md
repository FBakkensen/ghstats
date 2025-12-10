---
applyTo: '**'
---
Test approach and expectations:
- Work in a tight TDD loop (red → green → refactor); add or adjust tests before implementing behavior.
- Every feature or bug fix must include tests; no skipped or failing tests are acceptable when merging.
- Maintain very high coverage (aim ≥90% lines/branches) with meaningful assertions and regression cases for fixed bugs.
- Use Bun's native test runner (`bun test`) with deterministic fixtures/mocks for external services; keep tests fast and isolated (temp dirs/config per test).