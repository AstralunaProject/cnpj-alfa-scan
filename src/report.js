import { REGRAS } from "./rules.js";

/**
 * @typedef {import("./engine.js").Achado} Achado
 * @typedef {{ achados: Achado[], arquivosAnalisados: number }} Resultado
 */

const VERSAO = "0.1.0";
const REPOSITORIO = "https://github.com/AstralunaProject/cnpj-alfa-scan";

/** @param {boolean} ativo */
function cores(ativo) {
  /** @param {string} codigo */
  const c = (codigo) => (/** @type {string} */ texto) => (ativo ? `\x1b[${codigo}m${texto}\x1b[0m` : texto);
  return { vermelho: c("31"), amarelo: c("33"), cinza: c("90"), negrito: c("1"), verde: c("32") };
}

/**
 * @param {number} n
 * @param {string} singular
 * @param {string} plural
 */
function plural(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
}

/**
 * @param {Resultado} resultado
 * @param {{ cor?: boolean }} [opcoes]
 */
export function formatarTexto({ achados, arquivosAnalisados }, { cor = false } = {}) {
  const k = cores(cor);
  if (achados.length === 0) {
    return `${k.verde("✓")} Nenhum problema com CNPJ alfanumérico em ${plural(arquivosAnalisados, "arquivo", "arquivos")}.\n`;
  }
  const regras = new Map(REGRAS.map((r) => [r.id, r]));
  const linhas = [];
  for (const a of achados) {
    const nivel = a.severidade === "error" ? k.vermelho("erro ") : k.amarelo("aviso");
    linhas.push(`${k.negrito(`${a.arquivo}:${a.linha}:${a.coluna}`)}  ${nivel}  ${k.cinza(a.regra)}  ${a.titulo}`);
    linhas.push(`    ${a.trecho}`);
    linhas.push(`    ${k.cinza(`→ ${regras.get(a.regra)?.correcao ?? ""}`)}`);
    linhas.push("");
  }
  const erros = achados.filter((a) => a.severidade === "error").length;
  const avisos = achados.length - erros;
  const arquivos = new Set(achados.map((a) => a.arquivo)).size;
  linhas.push(
    `${plural(erros, "erro", "erros")}, ${plural(avisos, "aviso", "avisos")} em ${plural(arquivos, "arquivo", "arquivos")} ` +
      `(${plural(arquivosAnalisados, "arquivo analisado", "arquivos analisados")}).`,
  );
  return `${linhas.join("\n")}\n`;
}

/** @param {Resultado} resultado */
export function formatarJson({ achados, arquivosAnalisados }) {
  return `${JSON.stringify({ versao: VERSAO, arquivosAnalisados, achados }, null, 2)}\n`;
}

/** @param {Resultado} resultado */
export function formatarSarif({ achados }) {
  const sarif = {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "cnpj-alfa-scan",
            version: VERSAO,
            informationUri: REPOSITORIO,
            rules: REGRAS.map((r) => ({
              id: r.id,
              name: r.titulo,
              shortDescription: { text: r.titulo },
              fullDescription: { text: r.descricao },
              help: { text: r.correcao, markdown: `${r.descricao}\n\n**Correção:** ${r.correcao}` },
              helpUri: `${REPOSITORIO}#${r.id.toLowerCase()}`,
              defaultConfiguration: { level: r.severidade },
            })),
          },
        },
        results: achados.map((a) => ({
          ruleId: a.regra,
          level: a.severidade,
          message: { text: `${a.titulo}: ${a.trecho}` },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: a.arquivo },
                region: { startLine: a.linha, startColumn: a.coluna },
              },
            },
          ],
        })),
      },
    ],
  };
  return `${JSON.stringify(sarif, null, 2)}\n`;
}
