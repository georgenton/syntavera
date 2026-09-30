import { describe, expect, it } from "vitest";
import { contactSchema } from "@/modules/contact/schema";

const valid = {
  name: "María Pérez",
  organization: "Organización de prueba",
  email: "MARIA@EXAMPLE.COM",
  role: "Operaciones",
  process: "Necesitamos mejorar una decisión operacional repetitiva.",
  currentState: "Hoy el equipo reúne documentos manualmente y pierde contexto.",
  area: "Operaciones",
  privacyAcknowledged: "on",
  website: "",
};

describe("contact schema", () => {
  it("normalizes email and accepts complete context", () => {
    expect(contactSchema.parse(valid).email).toBe("maria@example.com");
  });

  it("rejects short context and missing privacy acknowledgement", () => {
    expect(contactSchema.safeParse({ ...valid, process: "corto" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, privacyAcknowledged: "" }).success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    expect(contactSchema.safeParse({ ...valid, website: "bot.example" }).success).toBe(false);
  });
});
