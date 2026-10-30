import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analisarTexto } from "../src/engine.js";
import { REGRAS } from "../src/rules.js";

/** @param {string} texto */
const ids = (texto) => analisarTexto(texto).map((a) => a.regra);

/** @type {Record<string, { detecta: string[], ignora: string[] }>} */
const CASOS = {
  CA001: {
    detecta: [
      "if (!/^\\d{14}$/.test(cnpj)) return false;",
      "CNPJ_RE = re.compile(r'^[0-9]{14}$')",
      "const raiz = cnpj.match(/\\d{12}/);",
    ],
    ignora: ["const telefone = /^\\d{14}$/;", "if (/^[A-Z0-9]{12}\\d{2}$/.test(cnpj)) ok();"],
  },
  CA002: {
    detecta: ["const RE = /^\\d{2}\\.\\d{3}\\.\\d{3}\\/\\d{4}-\\d{2}$/;", "pattern = '[0-9]{2}.[0-9]{3}.[0-9]{3}/[0-9]{4}-[0-9]{2}'"],
    ignora: ["const RE = /^[A-Z0-9]{2}\\.[A-Z0-9]{3}\\.[A-Z0-9]{3}\\/[A-Z0-9]{4}-\\d{2}$/;"],
  },
  CA003: {
    detecta: [
      "const chave = parseInt(cnpj, 10);",
      "valor = int(cnpj)",
      "long id = Long.parseLong(cnpj);",
      "var n = long.Parse(Cnpj);",
      "n, _ := strconv.Atoi(cnpj)",
      "id = cnpj.to_i",
      "digitos = [int(d) for d in cnpj]",
      "const d = cnpj.split('').map(Number);",
      "$n = (int) $cnpj;",
      "WHERE CAST(cnpj AS BIGINT) = 1",
      "Character.getNumericValue(cnpj.charAt(i))",
    ],
    ignora: ["const qtd = parseInt(quantidade, 10);", "print(cnpj)", "WHERE CAST(cnpj AS VARCHAR(14)) = '1'", "const v = cnpj.charCodeAt(i) - 48;"],
  },
  CA004: {
    detecta: [
      "return cnpj.replace(/\\D/g, '');",
      "cnpj = re.sub(r'[^0-9]', '', cnpj)",
      "$cnpj = preg_replace('/[^\\d]/', '', $cnpj);",
      "cnpj = somente_numeros(cnpj)",
      "const limpo = onlyDigits(cnpj);",
    ],
    ignora: ["return cnpj.replace(/[.\\/-]/g, '');", "telefone.replace(/\\D/g, '')"],
  },
  CA005: {
    detecta: ["return cnpj.isdigit()", "if (!ctype_digit($cnpj)) {", "if (isNaN(cnpj)) return;", "if (/^\\d+$/.test(cnpj)) ok();", "if (!is_numeric($cnpj))"],
    ignora: ["return cep.isdigit()"],
  },
  CA006: {
    detecta: [
      "  cnpj BIGINT NOT NULL,",
      "  `cnpj_fornecedor` bigint(14) unsigned,",
      "ALTER TABLE x ALTER COLUMN cnpj TYPE bigint;",
      "  cnpj NUMBER(14)",
      "  cnpj: number;",
      "def f(cnpj: int) -> None:",
      "private Long cnpj;",
      "public long Cnpj { get; set; }",
      "  Cnpj int64 `json:\"cnpj\"`",
      "    cnpj = models.BigIntegerField()",
      "    cnpj = Column(BigInteger, nullable=False)",
      "    cnpj = db.Column(db.Numeric(14))",
      "  cnpj: { type: Number, required: true },",
      "  cnpj: { type: DataTypes.BIGINT },",
      "$table->bigInteger('cnpj');",
      "t.bigint :cnpj",
      "add_column :empresas, :cnpj, :bigint",
      '"cnpj": { "type": "integer" }',
      "  cnpj: z.number(),",
      "  cnpj     BigInt   @unique",
    ],
    ignora: [
      "  cnpj CHAR(14) NOT NULL,",
      "  cnpj VARCHAR(14),",
      "  cnpj: string;",
      "private String cnpj;",
      "int cnpjLength = cnpj.length();",
      "    cnpj = models.CharField(max_length=14)",
      "$table->string('cnpj', 14);",
      "// valida o cnpj e retorna",
    ],
  },
  CA007: {
    detecta: ['<input name="cnpj" type="number" />', '<input\n  id="cnpj"\n  type="number"\n/>', "<TextField label=\"CNPJ\" type={'number'} />"],
    ignora: ['<input name="quantidade" type="number" />', '<input name="cnpj" type="text" />'],
  },
  CA008: {
    detecta: ['<input name="cnpj" inputmode="numeric" />', '<input name="cnpj" type="tel" />', '<TextInput placeholder="CNPJ" keyboardType="numeric" />', '<input name="cnpj" pattern="[0-9]*" />'],
    ignora: ['<input name="telefone" type="tel" />', '<input name="cnpj" autocapitalize="characters" />'],
  },
  CA009: {
    detecta: ["mask: '00.000.000/0000-00'", '$("#doc").mask("99.999.999/9999-99");', 'new MaskFormatter("##.###.###/####-##")'],
    ignora: ["mask: 'AA.AAA.AAA/AAAA-00'", "const exemplo = '11.222.333/0001-81';"],
  },
  CA010: {
    detecta: ["return str(cnpj).zfill(14)", "cnpj.toString().padStart(14, '0')", 'String.format("%014d", cnpj)'],
    ignora: ["return str(cpf).zfill(11)", "codigo.padStart(14, '0')"],
  },
};

describe("regras", () => {
  it("todas as regras têm casos de teste e ids únicos", () => {
    assert.deepEqual(Object.keys(CASOS).sort(), REGRAS.map((r) => r.id).sort());
    assert.equal(new Set(REGRAS.map((r) => r.id)).size, REGRAS.length);
  });

  for (const [id, { detecta, ignora }] of Object.entries(CASOS)) {
    describe(id, () => {
      for (const codigo of detecta) {
        it(`detecta: ${codigo.replace(/\n/g, "⏎")}`, () => assert.ok(ids(codigo).includes(id), `esperava ${id}, veio ${ids(codigo)}`));
      }
      for (const codigo of ignora) {
        it(`ignora: ${codigo.replace(/\n/g, "⏎")}`, () => assert.ok(!ids(codigo).includes(id), `não esperava ${id}`));
      }
    });
  }
});

describe("analisarTexto", () => {
  it("informa linha, coluna e trecho", () => {
    const [achado] = analisarTexto("const a = 1;\n  cnpj BIGINT,", { arquivo: "x.sql" });
    assert.deepEqual(achado, {
      regra: "CA006",
      severidade: "error",
      titulo: "CNPJ declarado com tipo numérico",
      arquivo: "x.sql",
      linha: 2,
      coluna: 3,
      trecho: "cnpj BIGINT,",
    });
  });

  it("respeita comentários de supressão", () => {
    assert.deepEqual(ids("cnpj BIGINT, -- cnpj-alfa-scan-ignore"), []);
    assert.deepEqual(ids("-- cnpj-alfa-scan-ignore-next-line\ncnpj BIGINT,"), []);
    assert.deepEqual(ids("-- cnpj-alfa-scan-ignore-next-line\nx INT,\ncnpj BIGINT,"), ["CA006"]);
  });

  it("ordena por linha e coluna", () => {
    const achados = analisarTexto('<X mask="00.000.000/0000-00" name="cnpj" inputmode="numeric" />');
    assert.deepEqual(achados.map((a) => a.regra), ["CA009", "CA008"]);
  });
});
