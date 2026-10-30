import { formatarCnpj, normalizarCnpj, validarCnpj } from "../src/cnpj.js";
import { analisarTexto, regraPorId } from "../src/engine.js";

const EXEMPLO = `CREATE TABLE empresa (
  id SERIAL PRIMARY KEY,
  cnpj BIGINT NOT NULL UNIQUE
);

export function limparCnpj(cnpj) {
  return cnpj.replace(/\\D/g, "");
}

export function validarCnpj(cnpj) {
  if (!/^\\d{14}$/.test(cnpj)) return false;
  return parseInt(cnpj, 10) > 0;
}

<input name="cnpj" type="number" />
<input name="cnpjMatriz" mask="00.000.000/0000-00" inputmode="numeric" />

class Empresa(models.Model):
    cnpj = models.BigIntegerField(unique=True)
`;

/** @param {string} id */
const elemento = (id) => /** @type {HTMLElement} */ (document.getElementById(id));
const codigo = /** @type {HTMLTextAreaElement} */ (elemento("codigo"));
const resumo = elemento("resumo");
const lista = elemento("achados");
const campoCnpj = /** @type {HTMLInputElement} */ (elemento("cnpj"));
const validade = elemento("validade");

/**
 * @param {string} tag
 * @param {string} classe
 * @param {string} texto
 */
function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  el.className = classe;
  el.textContent = texto;
  return el;
}

function analisar() {
  const achados = analisarTexto(codigo.value, { arquivo: "trecho" });
  lista.replaceChildren();
  if (codigo.value.trim() === "") {
    resumo.textContent = "Cole código para analisar.";
    return;
  }
  if (achados.length === 0) {
    resumo.textContent = "✓ Nenhum problema encontrado.";
    return;
  }
  const erros = achados.filter((a) => a.severidade === "error").length;
  resumo.textContent = `${erros} ${erros === 1 ? "erro" : "erros"}, ${achados.length - erros} ${achados.length - erros === 1 ? "aviso" : "avisos"}.`;
  for (const a of achados) {
    const item = document.createElement("li");
    item.className = a.severidade;
    const cabecalho = criar("div", "cabecalho", "");
    cabecalho.append(
      criar("span", "nivel", a.severidade === "error" ? "erro" : "aviso"),
      criar("span", "", `linha ${a.linha}`),
      criar("span", "", a.titulo),
      criar("span", "regra", a.regra),
    );
    item.append(cabecalho, criar("code", "trecho", a.trecho), criar("p", "correcao", `→ ${regraPorId(a.regra)?.correcao ?? ""}`));
    lista.append(item);
  }
}

function validar() {
  const valor = normalizarCnpj(campoCnpj.value);
  if (valor === "") {
    validade.textContent = "";
    validade.className = "";
    return;
  }
  const ok = validarCnpj(valor);
  validade.className = ok ? "valido" : "invalido";
  validade.textContent = ok ? `✓ ${formatarCnpj(valor)} é válido.` : "✗ CNPJ inválido.";
}

let pendente = 0;
codigo.addEventListener("input", () => {
  clearTimeout(pendente);
  pendente = window.setTimeout(analisar, 150);
});
campoCnpj.addEventListener("input", validar);
elemento("exemplo").addEventListener("click", () => {
  codigo.value = EXEMPLO;
  analisar();
});
elemento("limpar").addEventListener("click", () => {
  codigo.value = "";
  analisar();
  codigo.focus();
});

codigo.value = EXEMPLO;
analisar();
