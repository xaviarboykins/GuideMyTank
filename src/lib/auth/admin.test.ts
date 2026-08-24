import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
  })),
}));

import { assertAdmin, requireAdmin } from "./admin";

describe("admin authentication redirects", () => {
  beforeEach(() => {
    mocks.getUser.mockReset();
    mocks.redirect.mockReset();
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it.each([
    ["requireAdmin", requireAdmin],
    ["assertAdmin", assertAdmin],
  ])("redirects an unauthenticated %s request instead of throwing a 500", async (_name, authorize) => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(authorize()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledWith("/auth/login");
  });
});
