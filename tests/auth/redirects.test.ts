import { describe, expect, it } from "vitest";

import {
  DEFAULT_ADMIN_DESTINATION,
  safeAdminNextPath,
} from "@/lib/admin-redirect";

describe("safeAdminNextPath", () => {
  it("defaults empty values to /admin", () => {
    expect(safeAdminNextPath(null)).toBe(DEFAULT_ADMIN_DESTINATION);
    expect(safeAdminNextPath(undefined)).toBe("/admin");
    expect(safeAdminNextPath("")).toBe("/admin");
  });

  it("accepts safe admin paths", () => {
    expect(safeAdminNextPath("/admin")).toBe("/admin");
    expect(safeAdminNextPath("/admin/publications")).toBe(
      "/admin/publications",
    );
    expect(safeAdminNextPath("/admin/events?tab=1")).toBe(
      "/admin/events?tab=1",
    );
  });

  it("rejects login destination and open redirects", () => {
    expect(safeAdminNextPath("/admin/login")).toBe("/admin");
    expect(safeAdminNextPath("/admin/login/extra")).toBe("/admin");
    expect(safeAdminNextPath("//evil.com")).toBe("/admin");
    expect(safeAdminNextPath("https://evil.com")).toBe("/admin");
    expect(safeAdminNextPath("/publications")).toBe("/admin");
  });
});
