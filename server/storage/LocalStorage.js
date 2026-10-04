import { mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as esperar } from "node:timers/promises";

const EXTENSAO = ".json";

// No Windows, antivírus e sincronizadores como o OneDrive seguram o arquivo
// por alguns milissegundos e a troca falha com um destes códigos.
const ERROS_PASSAGEIROS = new Set(["EPERM", "EBUSY", "EACCES"]);

/**
 * localStorage do servidor. Tem a mesma interface do navegador (getItem,
 * setItem, removeItem, clear, key e length), mas cada chave vira um arquivo
 * JSON dentro de `pasta`, para os dados sobreviverem a um reinício.
 *
 * As leituras vêm da memória. As gravações vão para o disco em segundo plano
 * e `descarregar()` espera todas terminarem.
 */
export class LocalStorage {
  #pasta;
  #itens = new Map();
  #alteradas = new Set();
  #gravacao = null;

  constructor(pasta) {
    this.#pasta = pasta;
    mkdirSync(pasta, { recursive: true });

    for (const nome of readdirSync(pasta)) {
      const caminho = join(pasta, nome);
      if (nome.endsWith(".tmp")) {
        rmSync(caminho, { force: true });
        continue;
      }
      if (!nome.endsWith(EXTENSAO)) continue;

      let chave;
      try {
        chave = decodeURIComponent(nome.slice(0, -EXTENSAO.length));
      } catch {
        continue;
      }
      // Editores do Windows costumam gravar um BOM que quebra o JSON.parse.
      const valor = readFileSync(caminho, "utf8").replace(/^﻿/, "");
      this.#itens.set(chave, valor);
    }
  }

  get length() {
    return this.#itens.size;
  }

  key(indice) {
    return [...this.#itens.keys()][indice] ?? null;
  }

  getItem(chave) {
    return this.#itens.get(String(chave)) ?? null;
  }

  setItem(chave, valor) {
    this.#itens.set(String(chave), String(valor));
    this.#agendar(String(chave));
  }

  removeItem(chave) {
    if (this.#itens.delete(String(chave))) this.#agendar(String(chave));
  }

  clear() {
    for (const chave of [...this.#itens.keys()]) this.removeItem(chave);
  }

  /** Espera as gravações pendentes chegarem ao disco. */
  descarregar() {
    return this.#gravacao ?? Promise.resolve();
  }

  #arquivo(chave) {
    return join(this.#pasta, encodeURIComponent(chave) + EXTENSAO);
  }

  #agendar(chave) {
    this.#alteradas.add(chave);
    if (this.#gravacao) return;

    this.#gravacao = this.#gravarAlteradas();
    // Quem chama descarregar() recebe o erro. Este catch só evita derrubar o
    // processo quando ninguém está esperando.
    this.#gravacao.catch((erro) => {
      console.error(`[dados] não foi possível gravar: ${erro.message}`);
    });
  }

  async #gravarAlteradas() {
    // Várias alterações seguidas na mesma chave viram uma gravação só.
    await null;
    try {
      while (this.#alteradas.size > 0) {
        const [chave] = this.#alteradas;
        this.#alteradas.delete(chave);
        try {
          await this.#gravar(chave);
        } catch (erro) {
          this.#alteradas.add(chave);
          throw erro;
        }
      }
    } finally {
      this.#gravacao = null;
    }
  }

  async #gravar(chave) {
    const destino = this.#arquivo(chave);
    if (!this.#itens.has(chave)) {
      await rm(destino, { force: true });
      return;
    }

    // Grava em um arquivo temporário e troca no final: se o processo cair no
    // meio, o arquivo antigo continua inteiro.
    const conteudo = this.#itens.get(chave);
    const temporario = `${destino}.${process.pid}.tmp`;
    await writeFile(temporario, conteudo, "utf8");

    for (let tentativa = 1; ; tentativa += 1) {
      try {
        await rename(temporario, destino);
        return;
      } catch (erro) {
        if (!ERROS_PASSAGEIROS.has(erro.code)) throw erro;
        if (tentativa === 6) break;
        await esperar(25 * 2 ** tentativa);
      }
    }

    await writeFile(destino, conteudo, "utf8");
    await rm(temporario, { force: true });
  }
}
