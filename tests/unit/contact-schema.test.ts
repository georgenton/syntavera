import { describe, expect, it } from "vitest";
import { contactSchema } from "@/modules/contact/schema";

const valid = {
  submissionKey: "00000000-0000-4000-8000-000000000001",
  name: "María Pérez",
  organization: "",
  email: "MARIA@EXAMPLE.COM",
  role: "",
  description: "Hoy el equipo reúne documentos manualmente y pierde contexto para una decisión operacional.",
  area: "Operaciones",
  privacyAcknowledged: "on",
  website: "",
};

describe("contact schema", () => {
  it("normalizes email and accepts optional organization and role", () => {
    const parsed = contactSchema.parse(valid);
    expect(parsed.email).toBe("maria@example.com");
    expect(parsed.organization).toBeUndefined();
    expect(parsed.role).toBeUndefined();
  });

  it("rejects short context and missing privacy acknowledgement", () => {
    expect(contactSchema.safeParse({ ...valid, description: "corto" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, privacyAcknowledged: "" }).success).toBe(false);
  });

  it("requires a request key so retries are idempotent", () => {
    expect(contactSchema.safeParse({ ...valid, submissionKey: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    expect(contactSchema.safeParse({ ...valid, website: "bot.example" }).success).toBe(false);
  });
});
