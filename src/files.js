import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const EXTENSOES = new Set([
  "js", "mjs", "cjs", "jsx", "ts", "mts", "cts", "tsx", "vue", "svelte", "astro",
  "py", "rb", "php", "java", "kt", "kts", "scala", "groovy", "cs", "vb", "fs",
  "go", "rs", "swift", "dart", "ex", "exs", "pl", "lua", "r",
  "sql", "prisma", "graphql", "gql", "proto",
  "html", "htm", "erb", "cshtml", "razor", "jsp", "twig", "blade", "hbs", "ejs", "pug",
  "json", "yaml", "yml", "xml", "xsd",
  "pas", "dpr", "prg", "cbl", "cob", "abap", "4gl", "pls", "pkb", "pks", "plsql",
]);

const DIRETORIOS_IGNORADOS = new Set([
  ".git", "node_modules", "vendor", "dist", "build", "out", "target", "bin", "obj",
  ".next", ".nuxt", ".svelte-kit", "coverage", "__pycache__", ".venv", "venv",
  ".tox", ".gradle", ".idea", ".vscode", "bower_components", ".terraform",
]);

const ARQUIVOS_IGNORADOS = /(?:\.min\.(?:js|css)|\.bundle\.js|-lock\.json|\.lock|\.map)$/i;
export const TAMANHO_MAXIMO = 1024 * 1024;

/** @param {string} caminho */
function extensaoSuportada(caminho) {
  const nome = caminho.toLowerCase();
  if (ARQUIVOS_IGNORADOS.test(nome)) return false;
  if (nome.endsWith(".blade.php")) return true;
  const ponto = nome.lastIndexOf(".");
  return ponto !== -1 && EXTENSOES.has(nome.slice(ponto + 1));
}

/** @param {string} caminho */
function emDiretorioIgnorado(caminho) {
  return caminho.split(/[\\/]/).some((parte) => DIRETORIOS_IGNORADOS.has(parte));
}

/**
 * Converte glob simples (`*`, `**`, `?`) em RegExp.
 * @param {string} glob
 */
export function globParaRegex(glob) {
  let fonte = "";
  for (let i = 0; i < glob.length; i++) {
    const c = /** @type {string} */ (glob[i]);
    if (c === "*" && glob[i + 1] === "*") {
      fonte += ".*";
      i++;
      if (glob[i + 1] === "/") i++;
    } else if (c === "*") {
      fonte += "[^/]*";
    } else if (c === "?") {
      fonte += "[^/]";
    } else {
      fonte += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${fonte}(?:/.*)?$`);
}

/** @param {string} raiz */
function arquivosDoGit(raiz) {
  try {
    const saida = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
      cwd: raiz,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return saida.split("\0").filter(Boolean);
  } catch {
    return null;
  }
}

/** @param {string} raiz */
function percorrer(raiz) {
  /** @type {string[]} */
  const arquivos = [];
  /** @param {string} dir */
  const visitar = (dir) => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      if (entrada.isSymbolicLink()) continue;
      const caminho = join(dir, entrada.name);
      if (entrada.isDirectory()) {
        if (!DIRETORIOS_IGNORADOS.has(entrada.name)) visitar(caminho);
      } else if (entrada.isFile()) {
        arquivos.push(relative(raiz, caminho).split(sep).join("/"));
      }
    }
  };
  visitar(raiz);
  return arquivos;
}

/**
 * Lista os arquivos analisáveis a partir de um caminho (arquivo ou diretório).
 * Usa o índice do git quando disponível, respeitando o .gitignore.
 * @param {string} alvo
 * @param {RegExp[]} [ignorar]
 * @returns {{ raiz: string, arquivos: string[] }}
 */
export function listarArquivos(alvo, ignorar = []) {
  if (statSync(alvo).isFile()) return { raiz: ".", arquivos: [alvo] };
  const candidatos = arquivosDoGit(alvo) ?? percorrer(alvo);
  const arquivos = candidatos.filter(
    (arq) => extensaoSuportada(arq) && !emDiretorioIgnorado(arq) && !ignorar.some((re) => re.test(arq)),
  );
  return { raiz: alvo, arquivos: arquivos.sort() };
}

/**
 * Lê o arquivo como texto; devolve null para binários ou arquivos grandes demais.
 * @param {string} caminho
 */
export function lerTexto(caminho) {
  const info = statSync(caminho, { throwIfNoEntry: false });
  if (!info?.isFile() || info.size > TAMANHO_MAXIMO) return null;
  const conteudo = readFileSync(caminho);
  if (conteudo.subarray(0, 8000).includes(0)) return null;
  return conteudo.toString("utf8");
}
