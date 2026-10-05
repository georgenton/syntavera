import { z } from "zod";
import rawContent from "./website-content.json";

const publicAssetPath = z.string().startsWith("/");

const labMediaSchema = z.object({
  kind: z.literal("video"),
  src: publicAssetPath,
  poster: publicAssetPath,
  captions: publicAssetPath,
  transcript: publicAssetPath,
  provenance: z.string().trim().min(1),
}).strict();

const labSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  territory: z.string().min(1),
  level: z.enum(["demo", "codev", "pilot", "lab"]),
  maturityLabel: z.string().min(1),
  promise: z.string().min(1),
  disclosure: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1),
  case: z.object({
    problem: z.string().min(1),
    user: z.string().min(1),
    workflow: z.string().min(1),
    built: z.string().min(1),
    aiRole: z.string().min(1),
    humanRole: z.string().min(1),
    evidence: z.string().min(1),
    limits: z.string().min(1),
    nextGate: z.string().min(1),
  }).strict(),
  media: labMediaSchema.optional(),
}).strict();

const websiteContentSchema = z.object({
  nav: z.array(z.object({ label: z.string(), href: z.string() })),
  hero: z.object({
    eyebrow: z.string(),
    title: z.string(),
    subtitle: z.string(),
    microproof: z.array(z.string()),
  }),
  problem: z.object({ title: z.string(), body: z.string() }),
  systemStages: z.array(z.object({
    label: z.string(),
    items: z.array(z.string()),
    note: z.string().optional(),
  })),
  labs: z.array(labSchema),
  process: z.array(z.object({ label: z.string(), description: z.string(), output: z.string() })),
  capabilities: z.array(z.object({
    index: z.string(),
    title: z.string(),
    description: z.string(),
    items: z.array(z.string()),
  })),
  trust: z.array(z.object({ index: z.string(), title: z.string(), description: z.string() })),
  finalCta: z.object({
    title: z.string(),
    body: z.string(),
    cta: z.object({ label: z.string(), href: z.string() }),
  }),
}).strict();

export type MaturityLevel = z.infer<typeof labSchema>["level"];
export type Lab = z.infer<typeof labSchema>;
export type ProcessStep = z.infer<typeof websiteContentSchema>["process"][number];
export type Capability = z.infer<typeof websiteContentSchema>["capabilities"][number];
export type TrustPrinciple = z.infer<typeof websiteContentSchema>["trust"][number];

export const websiteContent = websiteContentSchema.parse(rawContent);

const hrefMap: Record<string, string> = {
  "#/": "/",
  "#/labs": "/labs",
  "#/how-we-work": "/how-we-work",
  "#/capabilities": "/how-we-work#capabilities",
  "#/about": "/about",
};

export const publicNav = websiteContent.nav
  .filter((item) => item.label !== "Insights")
  .map((item) => ({ ...item, href: hrefMap[item.href] ?? item.href.replace(/^#/, "") }));

export const labs = websiteContent.labs;

export function getLab(slug: string) {
  return labs.find((lab) => lab.slug === slug);
}

export const demoLayers = [
  {
    title: "Lo que ve la persona",
    description: "Un flujo legible, estados claros y contexto suficiente para decidir.",
    items: ["Señales priorizadas", "Fuentes visibles", "Siguiente acción"],
  },
  {
    title: "Lo que hace la IA",
    description: "La IA propone: recupera contexto, organiza evidencia y prepara una respuesta evaluable.",
    items: ["Recuperación", "Síntesis", "Propuesta"],
  },
  {
    title: "Lo que verifica la persona",
    description: "La persona decide: valida las fuentes, corrige el criterio y deja un registro.",
    items: ["Evidencia", "Criterio", "Trazabilidad"],
  },
] as const;
