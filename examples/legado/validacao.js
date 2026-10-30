export function limparCnpj(cnpj) {
  return cnpj.replace(/\D/g, "");
}

export function validarCnpj(cnpj) {
  const limpo = limparCnpj(cnpj);
  if (!/^\d{14}$/.test(limpo)) return false;
  const digitos = limpo.split("").map(Number);
  return digitos.length === 14;
}

export const REGEX_CNPJ = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

export function chaveCache(cnpj) {
  return parseInt(cnpj, 10);
}
