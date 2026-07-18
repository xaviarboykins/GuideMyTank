import { describe, expect, it } from "vitest";

import { hasAdminRole } from "./admin-role";

describe("admin role authorization", () => {
  it("accepts only the trusted admin app metadata role", () => {
    expect(hasAdminRole({ app_metadata: { role: "admin" } })).toBe(true);
    expect(hasAdminRole({ app_metadata: { role: "editor" } })).toBe(false);
    expect(hasAdminRole({ app_metadata: {} })).toBe(false);
    expect(hasAdminRole(null)).toBe(false);
  });
});

