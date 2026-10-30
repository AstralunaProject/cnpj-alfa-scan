#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { executar } from "../src/cli.js";

const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const cor = process.stdout.isTTY === true && !process.env.NO_COLOR;
process.exitCode = executar(process.argv.slice(2), { cor, versao: version });
