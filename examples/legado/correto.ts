// Código já preparado para o CNPJ alfanumérico: nenhum achado esperado.
const FORMATO_CNPJ = /^[A-Z0-9]{12}\d{2}$/;

export interface Empresa {
  nome: string;
  cnpj: string;
}

export function limparCnpj(cnpj: string): string {
  return cnpj.replace(/[.\/-]/g, "").toUpperCase();
}

export function formatoValido(cnpj: string): boolean {
  return FORMATO_CNPJ.test(limparCnpj(cnpj));
}

export function valorDoCaractere(c: string): number {
  return c.charCodeAt(0) - 48;
}
