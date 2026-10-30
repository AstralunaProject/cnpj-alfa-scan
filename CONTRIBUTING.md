# Contribuindo

A forma mais útil de ajudar é mostrar código real que a ferramenta erra: um falso positivo ou um caso que deveria ser apontado. Use os modelos de issue; um trecho de poucas linhas basta.

## Adicionando ou ajustando uma regra

1. As regras ficam em [`src/rules.js`](src/rules.js). Cada uma tem `padroes` (expressões regulares aplicadas linha a linha) e, opcionalmente, `contexto`: quantas linhas em volta precisam citar "cnpj" para a regra valer.
2. Em [`test/regras.test.js`](test/regras.test.js), inclua o trecho em `detecta` e, se for um ajuste, um caso parecido em `ignora` que não deve ser apontado.
3. Rode `npm run semgrep` para regenerar `rules/semgrep.yml`.
4. Rode `npm run check`. Ele executa typecheck, testes, a conferência das regras Semgrep e a varredura do próprio repositório.

Prefira padrões estreitos: um falso positivo em projeto grande faz o time desligar a ferramenta.

## Ambiente

Node.js 20 ou mais recente. Sem dependências em tempo de execução.

```bash
npm install
npm run check
```
