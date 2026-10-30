import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatarCnpj, normalizarCnpj, validarCnpj } from "../src/cnpj.js";

describe("validarCnpj", () => {
  it("aceita o exemplo alfanumérico oficial da Receita", () => {
    assert.equal(validarCnpj("12.ABC.345/01DE-35"), true);
    assert.equal(validarCnpj("12ABC34501DE35"), true);
  });

  it("aceita letras minúsculas normalizando para maiúsculas", () => {
    assert.equal(validarCnpj("12.abc.345/01de-35"), true);
  });

  it("continua aceitando CNPJ numérico", () => {
    assert.equal(validarCnpj("11.222.333/0001-81"), true);
  });

  it("rejeita dígito verificador errado", () => {
    assert.equal(validarCnpj("12ABC34501DE34"), false);
    assert.equal(validarCnpj("11222333000180"), false);
  });

  it("rejeita letras nos dígitos verificadores, tamanho errado e zeros", () => {
    assert.equal(validarCnpj("12ABC34501DEAB"), false);
    assert.equal(validarCnpj("12ABC34501DE3"), false);
    assert.equal(validarCnpj("00000000000000"), false);
    assert.equal(validarCnpj(""), false);
  });
});

describe("formatação", () => {
  it("normaliza e formata", () => {
    assert.equal(normalizarCnpj(" 12.abc.345/01de-35 "), "12ABC34501DE35");
    assert.equal(formatarCnpj("12abc34501de35"), "12.ABC.345/01DE-35");
  });
});
