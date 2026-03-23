import { createServer } from "net";
import { spawn } from "child_process";

const CANDIDATES = [3000, 3001, 3002, 3003];

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

async function main() {
  const envPort = process.env.PORT ? Number(process.env.PORT) : null;

  if (envPort) {
    console.log(`PORT=${envPort} is set, using it directly.`);
    startNext(envPort);
    return;
  }

  for (const port of CANDIDATES) {
    if (await isPortFree(port)) {
      startNext(port);
      return;
    }
    console.log(`Port ${port} is in use, trying next...`);
  }

  console.error(
    `All candidate ports (${CANDIDATES.join(", ")}) are in use. ` +
      `Set PORT=<number> to specify a different port.`
  );
  process.exit(1);
}

function startNext(port) {
  console.log(`Starting Next.js dev server on port ${port}...`);
  const child = spawn(
    "npx",
    ["next", "dev", "--turbopack", "-p", String(port)],
    {
      stdio: "inherit",
      shell: true,
    }
  );
  child.on("exit", (code) => process.exit(code ?? 0));
}

main();
