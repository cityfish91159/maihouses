import { render, screen } from "@testing-library/react";

import { PERMISSIONS, type Permission } from "../../../types/permissions";
import { usePermission } from "../../../hooks/usePermission";

// Mock usePermission
vi.mock("../../../hooks/usePermission");
// Mock Supabase
vi.mock("../../../lib/supabase", () => ({
  supabase: {},
}));
// Mock Env
vi.mock("../../../config/env", () => ({
  mhEnv: {},
}));

import { RequirePermission as GuardComponent } from "../Guard";

import type { UsePermissionReturn } from "../../../hooks/usePermission";

const createPermissionMock = (hasPerm: boolean): UsePermissionReturn => ({
  hasPermission: vi.fn().mockReturnValue(hasPerm),
  hasAnyPermission: vi.fn().mockReturnValue(hasPerm),
  hasAllPermissions: vi.fn().mockReturnValue(hasPerm),
  role: hasPerm ? "resident" : "guest",
  isAuthenticated: hasPerm,
  isLoading: false,
  permissions: new Set<Permission>(),
});

describe("RequirePermission", () => {
  it("should render children when permission is granted", () => {
    // P7-Audit-C2: Strict Mock
    vi.mocked(usePermission).mockReturnValue(createPermissionMock(true));

    render(
      <GuardComponent permission={PERMISSIONS.VIEW_PRIVATE_WALL}>
        <div>Protected Content</div>
      </GuardComponent>,
    );

    expect(screen.getByText("Protected Content")).toBeDefined();
  });

  it("should render fallback when permission is denied", () => {
    vi.mocked(usePermission).mockReturnValue(createPermissionMock(false));

    render(
      <GuardComponent
        permission={PERMISSIONS.VIEW_PRIVATE_WALL}
        fallback={<div>Access Denied</div>}
      >
        <div>Protected Content</div>
      </GuardComponent>,
    );

    expect(screen.queryByText("Protected Content")).toBeNull();

    // P7-5 OPTIMIZATION: Verify Accessibility Roles
    // The fallback contains "Access Denied" text but logic in Guard simply renders fallback.
    // We need to ensure fallback is rendered.
    expect(screen.getByText("Access Denied")).toBeDefined();
  });
});
