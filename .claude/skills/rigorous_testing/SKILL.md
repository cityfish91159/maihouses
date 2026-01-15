---
name: rigorous_testing
description: Enforce a strict "Test-First" or "Test-Verification" workflow to prevent regressions.
allowed-tools: Bash, Read, Edit, Write
---

# Rigorous Testing Protocol

## 1. Golden Rule
**"If it's not tested, it doesn't work."**
- You must NEVER assume a change works without running tests.
- If existing tests fail, you must FIX the code, not the test (unless the test is obsolete).

## 2. When to Test
1.  **Before Changes**: Run relevant tests (`npm run test <file>`) to establish a baseline.
2.  **During Dev**: Create a new test case for the specific bug or feature you are working on.
3.  **After Changes**: Run the full suite (`npm run test`) to ensure no regressions.

## 3. Testing Stack Guidelines
- **Unit Tests (Vitest)**:
    - Use for utility functions, hooks, and individual components.
    - Mock API calls using `vi.mock`.
    - Path: `src/**/__tests__/*.test.ts`
- **Integration Tests (API)**:
    - critical for Backend logic in `api/`.
    - Use `node-mocks-http` to mock Request/Response objects if needed.
- **E2E Tests (Playwright)**:
    - Use for critical user flows (Login, Post creation).
    - Path: `e2e/*.spec.ts`

## 4. Mandatory Checklist
- [ ] Did I run the related test file?
- [ ] Did I pass all tests?
- [ ] If fixing a bug, is there a regression test added?
- [ ] Are type checks passing? (`npm run typecheck`)

## 5. Troubleshooting
- If tests hang: Check for unclosed handles or DB connections.
- If tests flake: Check for async/await issues or shared state.
