import { appendFileSync, writeFileSync } from "node:fs";
import { formatarSarif, formatarTexto } from "../src/report.js";
import { regraPorId } from "../src/engine.js";
import { NIVEIS_DE_FALHA } from "../src/rules.js";
import { analisarCaminhos } from "../src/scan.js";

/** @param {string} nome */
function entrada(nome) {
  return (process.env[`INPUT_${nome.toUpperCase()}`] ?? "").trim();
}

/** @param {string} valor */
function lista(valor) {
  return valor.split(/[\s]+/).map((v) => v.trim()).filter(Boolean);
}

/** @param {string} texto */
function escaparMensagem(texto) {
  return texto.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

/** @param {string} texto */
function escaparPropriedade(texto) {
  return escaparMensagem(texto).replace(/:/g, "%3A").replace(/,/g, "%2C");
}

/**
 * @param {string} variavel
 * @param {string} conteudo
 */
function anexar(variavel, conteudo) {
  const destino = process.env[variavel];
  if (destino) appendFileSync(destino, conteudo);
}

function principal() {
  const falhaEm = NIVEIS_DE_FALHA[entrada("fail-on") || "error"];
  if (!falhaEm) {
    console.log(`::error::fail-on inválido: ${escaparMensagem(entrada("fail-on"))} (use error, warning ou none)`);
    return 2;
  }
  const alvos = lista(entrada("path") || ".");
  const resultado = analisarCaminhos(alvos, { ignorar: lista(entrada("ignore")) });

  for (const a of resultado.achados) {
    const comando = a.severidade === "error" ? "error" : "warning";
    const correcao = regraPorId(a.regra)?.correcao ?? "";
    const props = `file=${escaparPropriedade(a.arquivo)},line=${a.linha},col=${a.coluna},title=${escaparPropriedade(`${a.regra}: ${a.titulo}`)}`;
    console.log(`::${comando} ${props}::${escaparMensagem(`${a.trecho}\n→ ${correcao}`)}`);
  }
  process.stdout.write(formatarTexto(resultado));

  const erros = resultado.achados.filter((a) => a.severidade === "error").length;
  const avisos = resultado.achados.length - erros;
  anexar("GITHUB_OUTPUT", `errors=${erros}\nwarnings=${avisos}\n`);

  const sarif = entrada("sarif");
  if (sarif) {
    writeFileSync(sarif, formatarSarif(resultado));
    anexar("GITHUB_OUTPUT", `sarif-file=${sarif}\n`);
  }

  const linhas = [
    "## cnpj-alfa-scan",
    "",
    resultado.achados.length === 0
      ? `✅ Nenhum problema com CNPJ alfanumérico em ${resultado.arquivosAnalisados} arquivos.`
      : `**${erros} erros** e **${avisos} avisos** em ${resultado.arquivosAnalisados} arquivos analisados.`,
  ];
  if (resultado.achados.length > 0) {
    linhas.push("", "| Arquivo | Regra | Problema |", "| --- | --- | --- |");
    for (const a of resultado.achados.slice(0, 200)) {
      linhas.push(`| \`${a.arquivo}:${a.linha}\` | ${a.regra} | ${a.titulo.replace(/\|/g, "\\|")} |`);
    }
    if (resultado.achados.length > 200) linhas.push("", `…e mais ${resultado.achados.length - 200}.`);
  }
  anexar("GITHUB_STEP_SUMMARY", `${linhas.join("\n")}\n`);

  return resultado.achados.some((a) => falhaEm.includes(a.severidade)) ? 1 : 0;
}

try {
  process.exitCode = principal();
} catch (erro) {
  console.log(`::error::${escaparMensagem(/** @type {Error} */ (erro).message)}`);
  process.exitCode = 2;
}
