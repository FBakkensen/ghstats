import { Command } from "commander";
import { setupRouter } from "./router";

export async function main() {
  const program = new Command();

  program
    .name("ghstats")
    .description("GitHub activity dashboard")
    .version("0.1.0");

  await setupRouter(program);

  await program.parseAsync(process.argv);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}
