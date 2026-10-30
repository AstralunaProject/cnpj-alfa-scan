import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const raiz = new URL("../", import.meta.url);
const destino = new URL("_site/", raiz);

rmSync(destino, { recursive: true, force: true });
mkdirSync(destino);
cpSync(new URL("site/", raiz), destino, { recursive: true });
cpSync(new URL("src/", raiz), new URL("src/", destino), { recursive: true });
rmSync(new URL("src/files.js", destino));
rmSync(new URL("src/scan.js", destino));
rmSync(new URL("src/cli.js", destino));
rmSync(new URL("src/index.js", destino));
rmSync(new URL("src/report.js", destino));

const app = new URL("app.js", destino);
writeFileSync(app, readFileSync(app, "utf8").replaceAll('"../src/', '"./src/'));
console.log("Site gerado em _site/");
