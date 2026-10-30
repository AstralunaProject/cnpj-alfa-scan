import { CONTEXTO_CNPJ, REGRAS } from "./rules.js";

/**
 * @typedef {import("./rules.js").Regra} Regra
 * @typedef {import("./rules.js").Severidade} Severidade
 * @typedef {object} Achado
 * @property {string} regra
 * @property {Severidade} severidade
 * @property {string} titulo
 * @property {string} arquivo
 * @property {number} linha
 * @property {number} coluna
 * @property {string} trecho
 */

const IGNORAR_LINHA = "cnpj-alfa-scan-ignore";
const IGNORAR_PROXIMA = "cnpj-alfa-scan-ignore-next-line";
const MAX_TRECHO = 200;

/**
 * @param {string[]} linhas
 * @param {number} i
 * @param {number} raio
 */
function citaCnpj(linhas, i, raio) {
  const inicio = Math.max(0, i - raio);
  const fim = Math.min(linhas.length - 1, i + raio);
  for (let j = inicio; j <= fim; j++) {
    if (CONTEXTO_CNPJ.test(/** @type {string} */ (linhas[j]))) return true;
  }
  return false;
}

/**
 * @param {string[]} linhas
 * @param {number} i
 */
function suprimida(linhas, i) {
  const linha = /** @type {string} */ (linhas[i]);
  if (linha.includes(IGNORAR_LINHA) && !linha.includes(IGNORAR_PROXIMA)) return true;
  return i > 0 && /** @type {string} */ (linhas[i - 1]).includes(IGNORAR_PROXIMA);
}

/**
 * @param {Regra} regra
 * @param {string} linha
 */
function primeiraOcorrencia(regra, linha) {
  let menor = -1;
  for (const padrao of regra.padroes) {
    const m = padrao.exec(linha);
    if (m && (menor === -1 || m.index < menor)) menor = m.index;
  }
  return menor;
}

/**
 * @param {string} texto
 * @param {{ arquivo?: string, regras?: Regra[] }} [opcoes]
 * @returns {Achado[]}
 */
export function analisarTexto(texto, { arquivo = "", regras = REGRAS } = {}) {
  const linhas = texto.split(/\r?\n/);
  /** @type {Achado[]} */
  const achados = [];
  for (let i = 0; i < linhas.length; i++) {
    const linha = /** @type {string} */ (linhas[i]);
    if (linha.length === 0) continue;
    for (const regra of regras) {
      if (regra.contexto !== undefined && !citaCnpj(linhas, i, regra.contexto)) continue;
      const indice = primeiraOcorrencia(regra, linha);
      if (indice === -1 || suprimida(linhas, i)) continue;
      achados.push({
        regra: regra.id,
        severidade: regra.severidade,
        titulo: regra.titulo,
        arquivo,
        linha: i + 1,
        coluna: indice + 1,
        trecho: linha.trim().slice(0, MAX_TRECHO),
      });
    }
  }
  return achados.sort((a, b) => a.linha - b.linha || a.coluna - b.coluna);
}

/** @param {string} id */
export function regraPorId(id) {
  return REGRAS.find((r) => r.id === id);
}
