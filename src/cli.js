import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { formatarJson, formatarSarif, formatarTexto } from "./report.js";
import { NIVEIS_DE_FALHA, REGRAS } from "./rules.js";
import { analisarCaminhos } from "./scan.js";

const AJUDA = `Uso: cnpj-alfa-scan [caminhos...] [opções]

Procura no código pontos que quebram com o CNPJ alfanumérico.

Opções:
  -f, --format <texto|json|sarif>  Formato da saída (padrão: texto)
  -o, --output <arquivo>           Grava o relatório em arquivo em vez da saída padrão
      --fail-on <error|warning|none>
                                   Severidade mínima que faz o comando sair com código 1 (padrão: error)
      --ignore <glob>              Ignora arquivos (pode repetir), ex.: --ignore "test/**"
      --rules                      Lista as regras
  -v, --version                    Mostra a versão
  -h, --help                       Mostra esta ajuda

Códigos de saída: 0 sem problemas, 1 problemas encontrados, 2 uso inválido.
`;

const FORMATOS = { texto: formatarTexto, text: formatarTexto, json: formatarJson, sarif: formatarSarif };

class ErroDeUso extends Error {}

/** @param {string[]} argv */
function lerOpcoes(argv) {
  try {
    return parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        format: { type: "string", short: "f", default: "texto" },
        output: { type: "string", short: "o" },
        "fail-on": { type: "string", default: "error" },
        ignore: { type: "string", multiple: true, default: [] },
        rules: { type: "boolean", default: false },
        version: { type: "boolean", short: "v", default: false },
        help: { type: "boolean", short: "h", default: false },
      },
    });
  } catch (erro) {
    throw new ErroDeUso(/** @type {Error} */ (erro).message);
  }
}

function listarRegras() {
  return REGRAS.map((r) => `${r.id}  ${r.severidade === "error" ? "erro " : "aviso"}  ${r.titulo}\n       ${r.correcao}`).join("\n") + "\n";
}

/**
 * @param {string[]} argv
 * @param {{ escrever?: (texto: string) => void, erro?: (texto: string) => void, cor?: boolean, versao?: string }} [io]
 * @returns {number}
 */
export function executar(argv, io = {}) {
  const escrever = io.escrever ?? ((t) => process.stdout.write(t));
  const erro = io.erro ?? ((t) => process.stderr.write(t));
  try {
    const { values, positionals } = lerOpcoes(argv);
    if (values.help) return escrever(AJUDA), 0;
    if (values.version) return escrever(`${io.versao ?? "desconhecida"}\n`), 0;
    if (values.rules) return escrever(listarRegras()), 0;

    const formatar = FORMATOS[/** @type {keyof typeof FORMATOS} */ (values.format)];
    if (!formatar) throw new ErroDeUso(`formato inválido: ${values.format} (use texto, json ou sarif)`);
    const falhaEm = NIVEIS_DE_FALHA[values["fail-on"]];
    if (!falhaEm) throw new ErroDeUso(`--fail-on inválido: ${values["fail-on"]} (use error, warning ou none)`);

    const alvos = positionals.length > 0 ? positionals : ["."];
    let resultado;
    try {
      resultado = analisarCaminhos(alvos, { ignorar: values.ignore });
    } catch (e) {
      const err = /** @type {NodeJS.ErrnoException} */ (e);
      if (err.code === "ENOENT") throw new ErroDeUso(`caminho não encontrado: ${err.path ?? alvos.join(" ")}`);
      throw err;
    }

    const cor = values.output === undefined && values.format === "texto" && (io.cor ?? false);
    const relatorio = formatar(resultado, { cor });
    if (values.output) {
      writeFileSync(values.output, relatorio);
      if (values.format !== "texto") escrever(formatarTexto(resultado, { cor: io.cor ?? false }));
    } else {
      escrever(relatorio);
    }
    return resultado.achados.some((a) => falhaEm.includes(a.severidade)) ? 1 : 0;
  } catch (e) {
    if (e instanceof ErroDeUso) {
      erro(`cnpj-alfa-scan: ${e.message}\nUse --help para ver as opções.\n`);
      return 2;
    }
    throw e;
  }
}
