import { readFileSync, writeFileSync } from "node:fs";
import { REGRAS } from "../src/rules.js";

const DESTINO = new URL("../rules/semgrep.yml", import.meta.url);

/** @param {string} texto */
const aspas = (texto) => `'${texto.replace(/'/g, "''")}'`;

/**
 * @param {RegExp} padrao
 * @param {number | undefined} contexto
 */
function paraPcre(padrao, contexto) {
  const flags = padrao.flags.includes("i") ? "(?i)" : "";
  const corpo = padrao.source;
  return contexto === undefined ? `${flags}${corpo}` : `${flags}^(?=.*(?i:cnpj)).*?${corpo}`;
}

export function gerar() {
  const regras = REGRAS.map((r) => {
    const padroes = r.padroes.map((p) => `          - pattern-regex: ${aspas(paraPcre(p, r.contexto))}`).join("\n");
    return [
      `  - id: cnpj-alfa-${r.id.toLowerCase()}`,
      `    message: ${aspas(`${r.titulo}. ${r.descricao} Correção: ${r.correcao}`)}`,
      `    severity: ${r.severidade === "error" ? "ERROR" : "WARNING"}`,
      "    languages: [generic]",
      "    metadata:",
      `      source: ${aspas(`https://github.com/AstralunaProject/cnpj-alfa-scan#${r.id.toLowerCase()}`)}`,
      "    patterns:",
      "      - pattern-either:",
      padroes,
    ].join("\n");
  });
  return [
    "# Gerado por scripts/semgrep.js a partir de src/rules.js. Não edite à mão.",
    "# Onde a CLI procura \"cnpj\" nas linhas vizinhas (CA001, CA007, CA008), aqui ele precisa",
    "# estar na mesma linha: campos de formulário quebrados em várias linhas podem escapar.",
    "rules:",
    ...regras,
    "",
  ].join("\n");
}

const conteudo = gerar();
if (process.argv.includes("--check")) {
  if (readFileSync(DESTINO, "utf8") !== conteudo) {
    console.error("rules/semgrep.yml está desatualizado. Rode: npm run semgrep");
    process.exitCode = 1;
  }
} else {
  writeFileSync(DESTINO, conteudo);
}
