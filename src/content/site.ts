import rawContent from "./website-content.json";

export type MaturityLevel = "demo" | "codev" | "pilot" | "lab";

export type Lab = {
  slug: string;
  title: string;
  territory: string;
  level: MaturityLevel;
  maturityLabel: string;
  promise: string;
  disclosure: string;
  stack: string[];
};

export type ProcessStep = {
  label: string;
  description: string;
  output: string;
};

export type Capability = {
  index: string;
  title: string;
  description: string;
  items: string[];
};

export type TrustPrinciple = {
  index: string;
  title: string;
  description: string;
};

type WebsiteContent = {
  nav: Array<{ label: string; href: string }>;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    microproof: string[];
  };
  problem: { title: string; body: string };
  systemStages: Array<{ label: string; note: string }>;
  labs: Lab[];
  process: ProcessStep[];
  capabilities: Capability[];
  trust: TrustPrinciple[];
  finalCta: { title: string; body: string };
};

export const websiteContent = rawContent as WebsiteContent;

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

export const publishableHomeLabs = labs.filter((lab) => lab.slug !== "llm-twin");

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

export const caseLedger = [
  ["Problema explorado", "Definido para el territorio del demo; no representa un encargo de cliente."],
  ["Usuario / rol", "Por completar con evidencia verificable antes de una publicación indexable."],
  ["Workflow actual", "Representación de capacidad, no observación de una operación de cliente."],
  ["Qué construimos", "Una experiencia demostrable que conecta señales, contexto, decisión y verificación."],
  ["Arquitectura publicable", "Capas de interfaz, orquestación y evidencia sin detalles internos ni credenciales."],
  ["Papel de la IA", "Preparar propuestas y contexto; no sustituir la decisión responsable."],
  ["Papel humano", "Revisar fuentes, aplicar criterio y aceptar o corregir el resultado."],
  ["Qué demuestra", "Que el flujo completo puede recorrerse y auditarse en una prueba de capacidad."],
  ["Qué no demuestra", "No demuestra precisión en producción, resultados de negocio ni desempeño con datos de cliente."],
  ["Estado real", "El indicado por la etiqueta de madurez del caso."],
  ["Riesgos y límites", "Dependen de datos, operación, evaluación y gobernanza todavía no validados en cliente."],
  ["Próximo gate", "Acordar una prueba pequeña, criterios de evaluación y límites antes de avanzar."],
] as const;
