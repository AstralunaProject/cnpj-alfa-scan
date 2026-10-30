import { join } from "node:path";
import { analisarTexto } from "./engine.js";
import { globParaRegex, lerTexto, listarArquivos } from "./files.js";

/**
 * @typedef {import("./engine.js").Achado} Achado
 * @param {string[]} alvos
 * @param {{ ignorar?: string[] }} [opcoes]
 * @returns {{ achados: Achado[], arquivosAnalisados: number }}
 */
export function analisarCaminhos(alvos, { ignorar = [] } = {}) {
  const padroes = ignorar.map(globParaRegex);
  /** @type {Achado[]} */
  const achados = [];
  let arquivosAnalisados = 0;
  for (const alvo of alvos) {
    const { raiz, arquivos } = listarArquivos(alvo, padroes);
    for (const arquivo of arquivos) {
      const caminho = raiz === "." ? arquivo : join(raiz, arquivo);
      const texto = lerTexto(caminho);
      if (texto === null) continue;
      arquivosAnalisados++;
      achados.push(...analisarTexto(texto, { arquivo: caminho.split("\\").join("/") }));
    }
  }
  return { achados, arquivosAnalisados };
}
