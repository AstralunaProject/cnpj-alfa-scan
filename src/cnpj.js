const PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_DV2 = [6, ...PESOS_DV1];
const FORMATO = /^[A-Z0-9]{12}\d{2}$/;
const ZEROS = /^0{14}$/;

/** @param {string} valor */
export function normalizarCnpj(valor) {
  return valor.replace(/[.\/\-\s]/g, "").toUpperCase();
}

/**
 * @param {string} base
 * @param {number[]} pesos
 */
function digitoVerificador(base, pesos) {
  let soma = 0;
  for (let i = 0; i < pesos.length; i++) {
    soma += (base.charCodeAt(i) - 48) * /** @type {number} */ (pesos[i]);
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * Valida CNPJ numérico ou alfanumérico (IN RFB 2.229/2024).
 * @param {string} valor
 */
export function validarCnpj(valor) {
  const cnpj = normalizarCnpj(valor);
  if (!FORMATO.test(cnpj) || ZEROS.test(cnpj)) return false;
  const dv1 = digitoVerificador(cnpj, PESOS_DV1);
  const dv2 = digitoVerificador(cnpj.slice(0, 12) + dv1, PESOS_DV2);
  return cnpj.endsWith(`${dv1}${dv2}`);
}

/** @param {string} valor */
export function formatarCnpj(valor) {
  const c = normalizarCnpj(valor);
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}
