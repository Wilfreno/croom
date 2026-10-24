// Fails when any staged file passed by lint-staged contains console.log
import { readFileSync } from "node:fs";
import { relative } from "node:path";

const pattern = /\bconsole\.log\s*\(/;
const hits = [];

for (const file of process.argv.slice(2)) {
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (pattern.test(line)) hits.push(`  ${relative(process.cwd(), file)}:${i + 1}  ${line.trim()}`);
    });
}

if (hits.length) {
  console.error("\nconsole.log found in staged files:\n" + hits.join("\n"));
  console.error("\nRemove them before committing (or bypass with --no-verify).\n");
  process.exit(1);
}
