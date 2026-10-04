import { localStorage } from "../storage/index.js";

/**
 * Uma lista de registros guardada em uma chave do localStorage do servidor.
 * Cada leitura devolve objetos novos, então alterar o resultado não muda o
 * que está salvo: só `gravar` muda.
 */
export function criarColecao(chave) {
  function ler() {
    const bruto = localStorage.getItem(chave);
    if (bruto === null) return [];
    try {
      const lista = JSON.parse(bruto);
      if (Array.isArray(lista)) return lista;
    } catch {
      // cai no erro abaixo
    }
    throw new Error(
      `O arquivo de dados "${chave}.json" não contém uma lista JSON válida. ` +
        "Corrija o arquivo ou apague-o para o servidor recriar os dados.",
    );
  }

  async function gravar(lista) {
    localStorage.setItem(chave, JSON.stringify(lista, null, 2));
    await localStorage.descarregar();
  }

  return {
    ler,
    gravar,
    existe: () => localStorage.getItem(chave) !== null,
  };
}
