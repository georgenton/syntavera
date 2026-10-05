import { describe, expect, it, vi } from "vitest";
import { persistContactSubmission } from "@/modules/contact/persistence-core";

describe("contact persistence", () => {
  it("does not confirm receipt when persistence fails", async () => {
    await expect(persistContactSubmission(
      async () => { throw new Error("database unavailable"); },
      async () => null,
    )).rejects.toThrow("database unavailable");
  });

  it("turns a repeated request key into the existing receipt", async () => {
    const findExisting = vi.fn(async () => ({ id: "existing-id" }));
    const result = await persistContactSubmission(
      async () => { throw { code: "P2002" }; },
      findExisting,
    );
    expect(result).toEqual({ outcome: "duplicate", id: "existing-id" });
    expect(findExisting).toHaveBeenCalledOnce();
  });
});
