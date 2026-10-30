/**
 * @typedef {"error" | "warning"} Severidade
 * @typedef {object} Regra
 * @property {string} id
 * @property {string} titulo
 * @property {Severidade} severidade
 * @property {string} descricao
 * @property {string} correcao
 * @property {RegExp[]} padroes
 * @property {number} [contexto] Linhas ao redor que precisam citar "cnpj". Ausente: não exige contexto.
 */

const NUMERICOS = "bigint|big_?integer|int|int2|int4|int8|int32|int64|uint32|uint64|integer|smallint|mediumint|tinyint|numeric|decimal|number|long|double|float";
const CAMPO = "cnpj(?!\\w*(?:len|length|size|count|idx|index|pos|tamanho|qtd))\\w*";

/** @type {Regra[]} */
export const REGRAS = [
  {
    id: "CA001",
    titulo: "Regex aceita só dígitos no CNPJ",
    severidade: "error",
    descricao: "O padrão exige 12 ou 14 dígitos. O CNPJ alfanumérico tem letras nas 12 primeiras posições.",
    correcao: "Use /^[A-Z0-9]{12}\\d{2}$/ (sem máscara) ou /^[A-Z0-9]{2}\\.?[A-Z0-9]{3}\\.?[A-Z0-9]{3}\\/?[A-Z0-9]{4}-?\\d{2}$/i.",
    padroes: [/(?:\\d|\[0-9\]|\[\\d\])\{1[24]\}/],
    contexto: 1,
  },
  {
    id: "CA002",
    titulo: "Regex de CNPJ formatado aceita só dígitos",
    severidade: "error",
    descricao: "O padrão reconhece o formato 00.000.000/0000-00 apenas com dígitos.",
    correcao: "Troque \\d por [A-Z0-9] nos 4 primeiros grupos; só os 2 dígitos verificadores continuam numéricos.",
    padroes: [/(?:\\d|\[0-9\])\{2\}.{0,12}?(?:\\d|\[0-9\])\{3\}.{0,12}?(?:\\d|\[0-9\])\{3\}.{0,12}?(?:\\d|\[0-9\])\{4\}/],
  },
  {
    id: "CA003",
    titulo: "CNPJ convertido para número",
    severidade: "error",
    descricao: "Converter o CNPJ para inteiro falha (NaN, exceção) ou corrompe o valor quando há letras.",
    correcao: "Mantenha o CNPJ como texto do começo ao fim. Para o dígito verificador, use o valor ASCII − 48 de cada caractere.",
    padroes: [
      /\b(?:parseInt|parseFloat|Number|BigInt|int|long|float|intval|floatval|Integer\.parseInt|Integer\.valueOf|Long\.parseLong|Long\.valueOf|BigInteger|BigDecimal|Convert\.ToInt(?:32|64)|Convert\.ToDecimal|(?:int|long|Int32|Int64|decimal)\.(?:Try)?Parse|strconv\.(?:Atoi|ParseInt|ParseUint)|to_number)\s*\(\s*[^()]*cnpj/i,
      new RegExp(`\\bCAST\\s*\\(\\s*\\w*cnpj\\w*\\s+AS\\s+(?:${NUMERICOS})\\b`, "i"),
      /\(\s*(?:int|long|float|double)\s*\)\s*\$?\w*cnpj/i,
      /\bcnpj\w*(?:\[[^\]]*\])?(?:\(\))?\.(?:to_i|toInt|toLong|toBigInteger|toDouble|intValue|longValue)\b/i,
      /\bint\(\s*(\w+)\s*\)\s+for\s+\1\s+in\s+[\w.]*cnpj/i,
      /cnpj\w*\.split\([^)]*\)\.map\(\s*(?:Number|parseInt|parseFloat)\b/i,
      /\bCharacter\.getNumericValue\b/,
    ],
    contexto: 0,
  },
  {
    id: "CA004",
    titulo: "Remoção de tudo que não é dígito",
    severidade: "error",
    descricao: "Limpar o CNPJ removendo não-dígitos apaga as letras do CNPJ alfanumérico.",
    correcao: "Remova só a pontuação: valor.replace(/[.\\/-]/g, \"\").toUpperCase().",
    padroes: [
      /(?:\\D|\[\^0-9\]|\[\^\\d\])/,
      /\b(?:only_?digits|digits_?only|only_?numbers|somente_?numeros|apenas_?numeros|so_?numeros|somente_?digitos|apenas_?digitos|extrair_?numeros|remover_?nao_?numericos)\s*\(/i,
    ],
    contexto: 0,
  },
  {
    id: "CA005",
    titulo: "Verificação de que o CNPJ é numérico",
    severidade: "error",
    descricao: "Checagens como isdigit, is_numeric ou ^\\d+$ rejeitam o CNPJ alfanumérico.",
    correcao: "Valide o formato com /^[A-Z0-9]{12}\\d{2}$/ e o dígito verificador.",
    padroes: [
      /\b(?:isdigit|isnumeric|isdecimal|ctype_digit|is_numeric|isNaN|IsDigit|IsNumber|isNumeric|isInteger|isSafeInteger|isdigit)\b/,
      /\^(?:\\d|\[0-9\])[+*]\$/,
      /\[\[:digit:\]\]/,
    ],
    contexto: 0,
  },
  {
    id: "CA006",
    titulo: "CNPJ declarado com tipo numérico",
    severidade: "error",
    descricao: "Coluna, campo ou propriedade numérica não comporta letras. É o ponto que mais quebra em produção.",
    correcao: "Use texto: CHAR(14)/VARCHAR(14) no banco, string no código.",
    padroes: [
      new RegExp(`\\b\\w*${CAMPO}["'\`\\]]?\\s+(?:set\\s+data\\s+)?(?:type\\s+)?(?:unsigned\\s+)?(?:${NUMERICOS})\\b`, "i"),
      new RegExp(`\\b${CAMPO}\\??\\s*:\\s*(?:number|bigint|int|long|u?int(?:32|64)|BigInteger|BigDecimal|Double|Decimal|float)\\b`, "i"),
      new RegExp(`\\b(?:long|int|integer|biginteger|bigdecimal|int64|uint64|ulong|double|decimal)\\??\\s+_?${CAMPO}\\b`, "i"),
      /\bcnpj\w*\s*=\s*(?:[\w.]+\.)?(?:Column\(\s*(?:[\w.]+\.)?)?(?:BigInteger|Integer|BigIntegerField|IntegerField|PositiveBigIntegerField|PositiveIntegerField|DecimalField|FloatField|Numeric|Float|IntField|BigIntField|LongField)\b/i,
      /\bcnpj\w*\s*:\s*\{?\s*type\s*:\s*(?:Number|(?:DataTypes|Sequelize)\.(?:BIGINT|INTEGER|DECIMAL|FLOAT|DOUBLE))\b/i,
      /->(?:unsigned)?(?:big|tiny|small|medium)?[iI]nteger\(\s*['"]\w*cnpj|->(?:decimal|double|float)\(\s*['"]\w*cnpj/i,
      /\bt\.(?:bigint|integer|decimal|float)\s+:\w*cnpj|:\w*cnpj\w*,\s*:(?:bigint|integer|decimal|float)\b/i,
      /"\w*cnpj\w*"\s*:\s*\{\s*"type"\s*:\s*"(?:integer|number)"/i,
      /\bcnpj\w*\s*:\s*z\.(?:number|bigint)\(/i,
    ],
  },
  {
    id: "CA007",
    titulo: "Campo de CNPJ com input numérico",
    severidade: "error",
    descricao: "type=\"number\" não aceita letras; o usuário não consegue digitar o CNPJ alfanumérico.",
    correcao: "Use type=\"text\" com autocapitalize=\"characters\" e maxlength=\"18\".",
    padroes: [/\btype\s*=\s*\{?\s*["'`]number["'`]/i],
    contexto: 3,
  },
  {
    id: "CA008",
    titulo: "Teclado ou máscara numérica no campo de CNPJ",
    severidade: "warning",
    descricao: "inputmode numérico, type=\"tel\" ou teclado numérico no app escondem as letras do teclado.",
    correcao: "Use inputmode=\"text\" (ou omita) e autocapitalize=\"characters\".",
    padroes: [
      /\binputmode\s*=\s*\{?\s*["'`](?:numeric|decimal|tel)["'`]/i,
      /\btype\s*=\s*\{?\s*["'`]tel["'`]/i,
      /\bkeyboardType\s*[=:]\s*\{?\s*["'`]?(?:numeric|number-pad|phone-pad|decimal-pad)/i,
      /\bKeyboardType\.(?:Number|Phone|NumberPassword|Decimal)\b|\bTextInputType\.(?:number|phone)\b|\bInputType\.TYPE_CLASS_(?:NUMBER|PHONE)\b/,
      /\bpattern\s*=\s*\{?\s*["'`]\^?(?:\\d|\[0-9\])/i,
    ],
    contexto: 3,
  },
  {
    id: "CA009",
    titulo: "Máscara de CNPJ só com dígitos",
    severidade: "error",
    descricao: "Máscaras como 99.999.999/9999-99 ou 00.000.000/0000-00 bloqueiam letras na digitação.",
    correcao: "Use uma máscara alfanumérica nos 12 primeiros caracteres, ex.: \"AA.AAA.AAA/AAAA-00\" (ngx-mask) ou equivalente.",
    padroes: [/["'`](?:99\.999\.999\/9999-99|00\.000\.000\/0000-00|##\.###\.###\/####-##|99999999999999|00000000000000)["'`]/],
  },
  {
    id: "CA010",
    titulo: "CNPJ formatado como número com zeros à esquerda",
    severidade: "warning",
    descricao: "zfill/padStart/%014d indicam que o CNPJ circula como número e é reconvertido em texto.",
    correcao: "Armazene e trafegue o CNPJ como texto de 14 caracteres; não reconstrua a partir de um número.",
    padroes: [/zfill\(\s*14\s*\)|padStart\(\s*14\s*,|%014d|:014d|PadLeft\(\s*14\s*,|lpad\([^)]*,\s*14\b|rjust\(\s*14\s*,\s*["']0/i],
    contexto: 0,
  },
];

export const CONTEXTO_CNPJ = /cnpj/i;

/** @type {Record<string, Severidade[]>} */
export const NIVEIS_DE_FALHA = { error: ["error"], warning: ["error", "warning"], none: [] };
