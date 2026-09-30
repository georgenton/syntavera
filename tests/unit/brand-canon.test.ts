import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (path.includes("generated")) return [];
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.(ts|tsx|json|css)$/.test(path) ? [path] : [];
  });
}

describe("public brand canon", () => {
  it("does not contain forbidden visible spellings", () => {
    const banned = ["Cinta" + " Vera", "Cinta" + "Vera", "Synta" + " Vera", "Synta" + "vera", "SYNTA" + "VERA", "syntavera" + ".com"];
    const files = sourceFiles(join(process.cwd(), "src")).filter((path) => !path.endsWith("brand-canon.test.ts"));
    const source = files.map((path) => readFileSync(path, "utf8")).join("\n");
    for (const value of banned) expect(source).not.toContain(value);
  });
});
