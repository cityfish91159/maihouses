
### 🟢 C2: Guard.test.tsx (2025-12-13 17:15)

**Status**: Fixed & Verified (Type B Evidence)

**Changes**:
1.  **Strict Typing**: Used `UsePermissionReturn` interface for mock factory.
2.  **No `as any`**: Replaced `(usePermission as any)` with `vi.mocked(usePermission)`.
3.  **Strict Set**: Explicitly typed `new Set<Permission>()`.
4.  **Clean Code**: Removed all conversational comments.

**Evidence (Runtime Output)**:
```bash
> vitest run src/components/auth/__tests__/Guard.test.tsx

 ✓ src/components/auth/__tests__/Guard.test.tsx (2 tests) 34ms
   ✓ RequirePermission > should render children when permission is granted
   ✓ RequirePermission > should render fallback when permission is denied
```
