import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { executar } from "../src/cli.js";
import { globParaRegex } from "../src/files.js";
import { REGRAS } from "../src/rules.js";

/** @param {Record<string, string | Buffer>} arquivos */
function projeto(arquivos) {
  const raiz = mkdtempSync(join(tmpdir(), "cnpj-alfa-"));
  for (const [caminho, conteudo] of Object.entries(arquivos)) {
    mkdirSync(join(raiz, caminho, ".."), { recursive: true });
    writeFileSync(join(raiz, caminho), conteudo);
  }
  return raiz;
}

/** @param {string[]} argv */
function rodar(argv) {
  let saida = "";
  let erro = "";
  const codigo = executar(argv, { escrever: (t) => (saida += t), erro: (t) => (erro += t), versao: "9.9.9" });
  return { codigo, saida, erro };
}

describe("cli", () => {
  it("sai com 0 quando não há problemas", () => {
    const raiz = projeto({ "a.ts": "const cnpj: string = '';\n" });
    const { codigo, saida } = rodar([raiz]);
    assert.equal(codigo, 0);
    assert.match(saida, /Nenhum problema .* 1 arquivo\./);
  });

  it("sai com 1 e lista os achados", () => {
    const raiz = projeto({ "db/schema.sql": "CREATE TABLE e (\n  cnpj BIGINT\n);\n" });
    const { codigo, saida } = rodar([raiz]);
    assert.equal(codigo, 1);
    assert.match(saida, /schema\.sql:2:3 +erro +CA006/);
    assert.match(saida, /1 erro, 0 avisos em 1 arquivo/);
  });

  it("--fail-on controla o código de saída", () => {
    const raiz = projeto({ "f.html": '<input name="cnpj" inputmode="numeric">\n' });
    assert.equal(rodar([raiz]).codigo, 0);
    assert.equal(rodar([raiz, "--fail-on", "warning"]).codigo, 1);
    const erros = projeto({ "e.sql": "cnpj BIGINT\n" });
    assert.equal(rodar([erros, "--fail-on", "none"]).codigo, 0);
  });

  it("ignora node_modules, binários, minificados e globs informados", () => {
    const raiz = projeto({
      "node_modules/lib/index.js": "cnpj BIGINT\n",
      "app.min.js": "cnpj BIGINT\n",
      "foto.png": "cnpj BIGINT\n",
      "dados.sql": Buffer.from([0x63, 0x6e, 0x70, 0x6a, 0x00, 0x20]),
      "test/fixture.sql": "cnpj BIGINT\n",
      "src/ok.sql": "cnpj CHAR(14)\n",
    });
    const { codigo, saida } = rodar([raiz, "--ignore", "test/**"]);
    assert.equal(codigo, 0, saida);
    assert.match(saida, /1 arquivo\./);
  });

  it("respeita o .gitignore em repositórios git", () => {
    const raiz = projeto({ ".gitignore": "gerado/\n", "gerado/x.sql": "cnpj BIGINT\n", "y.sql": "cnpj CHAR(14)\n" });
    execFileSync("git", ["init", "-q"], { cwd: raiz });
    assert.equal(rodar([raiz]).codigo, 0);
  });

  it("analisa um arquivo passado diretamente", () => {
    const raiz = projeto({ "m.py": "cnpj = models.BigIntegerField()\n" });
    const { codigo, saida } = rodar([join(raiz, "m.py")]);
    assert.equal(codigo, 1);
    assert.match(saida, /m\.py:1:1/);
  });

  it("gera SARIF 2.1.0 válido com todas as regras", () => {
    const raiz = projeto({ "s.sql": "cnpj BIGINT\n" });
    const destino = join(raiz, "out.sarif");
    const { codigo, saida } = rodar([raiz, "--ignore", "out.sarif", "-f", "sarif", "-o", destino]);
    assert.equal(codigo, 1);
    assert.match(saida, /1 erro/);
    const sarif = JSON.parse(readFileSync(destino, "utf8"));
    assert.equal(sarif.version, "2.1.0");
    const [run] = sarif.runs;
    assert.equal(run.tool.driver.rules.length, REGRAS.length);
    assert.equal(run.results[0].ruleId, "CA006");
    assert.equal(run.results[0].level, "error");
    assert.deepEqual(run.results[0].locations[0].physicalLocation.region, { startLine: 1, startColumn: 1 });
  });

  it("gera JSON", () => {
    const raiz = projeto({ "s.sql": "cnpj BIGINT\n" });
    const dados = JSON.parse(rodar([raiz, "--format", "json"]).saida);
    assert.equal(dados.arquivosAnalisados, 1);
    assert.equal(dados.achados[0].regra, "CA006");
  });

  it("rejeita uso inválido com código 2", () => {
    assert.equal(rodar(["--format", "xml"]).codigo, 2);
    assert.equal(rodar(["--fail-on", "talvez"]).codigo, 2);
    assert.equal(rodar(["--nao-existe"]).codigo, 2);
    const { codigo, erro } = rodar(["/caminho/que/nao/existe"]);
    assert.equal(codigo, 2);
    assert.match(erro, /caminho não encontrado/);
  });

  it("mostra versão, ajuda e regras", () => {
    assert.equal(rodar(["--version"]).saida, "9.9.9\n");
    assert.match(rodar(["--help"]).saida, /^Uso: cnpj-alfa-scan/);
    assert.match(rodar(["--rules"]).saida, /CA001 +erro/);
  });
});

describe("globParaRegex", () => {
  it("converte globs comuns", () => {
    assert.ok(globParaRegex("test/**").test("test/a/b.js"));
    assert.ok(globParaRegex("**/*.sql").test("db/m/1.sql"));
    assert.ok(globParaRegex("*.sql").test("a.sql"));
    assert.ok(!globParaRegex("*.sql").test("db/a.sql"));
    assert.ok(globParaRegex("legacy").test("legacy/x.js"));
    assert.ok(!globParaRegex("legacy").test("legacy2/x.js"));
  });
});

describe("pacote", () => {
  it("versão do SARIF acompanha o package.json", () => {
    const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    const report = readFileSync(new URL("../src/report.js", import.meta.url), "utf8");
    assert.match(report, new RegExp(`const VERSAO = "${version.replace(/\./g, "\\.")}"`));
  });
});
