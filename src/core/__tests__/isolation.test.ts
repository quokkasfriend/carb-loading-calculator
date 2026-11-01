import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === "__tests__") return [];
    if (statSync(path).isDirectory()) return sources(path);
    return path.endsWith(".ts") ? [path] : [];
  });
}

/** Source without comments and string literals (keeps template literal structure out of the way too). */
function code(file: string): string {
  return readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
}

const files = sources(ROOT);
const rel = (f: string) => relative(ROOT, f);

describe("isolation of the engine", () => {
  it("finds the engine files", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files.map((f) => [rel(f), f] as const))("%s imports nothing from the UI or a framework", (_name, file) => {
    const imports = [...readFileSync(file, "utf8").matchAll(/(?:from|import)\s+["']([^"']+)["']/g)].map((m) => m[1]);
    for (const spec of imports) {
      expect(spec).not.toMatch(/ui\//);
      expect(spec).not.toMatch(/^react(-dom)?(\/|$)/);
      expect(spec).not.toMatch(/intl/);
    }
  });

  it.each(files.map((f) => [rel(f), f] as const))("%s is deterministic", (_name, file) => {
    const src = code(file);
    expect(src).not.toMatch(/Date\.now/);
    expect(src).not.toMatch(/new Date\(\s*\)/);
    expect(src).not.toMatch(/Math\.random/);
  });

  it.each(files.filter((f) => rel(f).startsWith("steps")).map((f) => [rel(f), f] as const))(
    "%s has no numeric literal besides 0, 1, -1 and 100",
    (_name, file) => {
      const literals = [...code(file).matchAll(/(?<![\w.$])\d+(?:\.\d+)?/g)].map((m) => m[0]);
      expect(literals.filter((n) => !["0", "1", "100"].includes(n))).toEqual([]);
    },
  );
});
