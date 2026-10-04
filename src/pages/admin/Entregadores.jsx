import { useMemo, useState } from "react";
import Mapa from "../../components/Mapa";
import { IconeFechar, IconeMais } from "../../components/Icones";
import { usePainel } from "../../context/PainelContext";
import { LOJA } from "../../data/catalogo";
import {
  dataCurta,
  haQuantoTempo,
  mascaraTelefone,
  primeiroNome,
} from "../../lib/format";
import { useAgora } from "../../lib/relogio";

const VAZIO = { nome: "", telefone: "", veiculo: "", placa: "", senha: "" };

export default function Entregadores() {
  const { entregadores, definirEntregadorAtivo, removerEntregador } =
    usePainel();
  const [editando, setEditando] = useState(null);
  const agora = useAgora();

  const ativos = entregadores.filter((e) => e.ativo).length;
  const naRua = entregadores.filter((e) => e.naRua.length > 0).length;
  const localizados = entregadores.filter((e) => e.posicao);

  const pontos = useMemo(
    () => [
      { id: "loja", tipo: "loja", lat: LOJA.lat, lng: LOJA.lng, rotulo: "Loja" },
      ...entregadores
        .filter((e) => e.posicao)
        .map((e) => ({
          id: e.id,
          tipo: "entregador",
          lat: e.posicao.lat,
          lng: e.posicao.lng,
          rotulo: primeiroNome(e.nome),
        })),
    ],
    [entregadores],
  );

  const excluir = (e) => {
    if (
      window.confirm(
        `Excluir ${e.nome}? O acesso dele é encerrado. Os pedidos que ele entregou continuam com o nome dele.`,
      )
    ) {
      removerEntregador(e.id);
    }
  };

  return (
    <>
      <header className="admin__cabecalho">
        <div>
          <h1>Entregadores</h1>
          <p className="admin__apoio">
            {ativos} {ativos === 1 ? "ativo" : "ativos"}. {naRua} na rua agora.
          </p>
        </div>
        <div className="admin__cabecalho-acoes">
          <button
            type="button"
            className="btn btn--ambar btn--pequeno"
            onClick={() => setEditando({ ...VAZIO, novo: true })}
          >
            <IconeMais width={16} height={16} />
            Novo entregador
          </button>
        </div>
      </header>

      <section className="painel">
        <h2 className="painel__titulo">Onde eles estão</h2>
        <Mapa pontos={pontos} rotulo="Mapa dos entregadores" />
        <p className="admin__apoio">
          {localizados.length === 0
            ? "Ninguém compartilhando a posição agora. Ela aparece enquanto o entregador está com pedido na rua e com o app aberto."
            : `${localizados.length} no mapa. A posição some quando a última entrega do entregador termina.`}
        </p>
      </section>

      {entregadores.length === 0 ? (
        <p className="vazio">
          Nenhum entregador cadastrado. Cadastre o primeiro para poder
          despachar pedidos.
        </p>
      ) : (
        <div className="tabela-area">
          <table className="tabela">
            <thead>
              <tr>
                <th>Entregador</th>
                <th>Contato</th>
                <th>Veículo</th>
                <th>Agora</th>
                <th>Entregas</th>
                <th>Ativo</th>
                <th className="tabela--direita">Ações</th>
              </tr>
            </thead>
            <tbody>
              {entregadores.map((e) => (
                <tr key={e.id}>
                  <td data-rotulo="Entregador">
                    <div className="cliente-celula">
                      <span className="cliente-celula__inicial" aria-hidden="true">
                        {e.nome.charAt(0)}
                      </span>
                      <div>
                        <strong>{e.nome}</strong>
                        <span className="tabela__secundario">
                          {e.demo
                            ? "exemplo, sem senha de acesso"
                            : `desde ${dataCurta(e.criadoEm)}`}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="tabela__data" data-rotulo="Contato">
                    {e.telefone}
                  </td>
                  <td data-rotulo="Veículo">
                    <div>
                      {e.veiculo || "não informado"}
                      {e.placa && (
                        <span className="tabela__secundario">{e.placa}</span>
                      )}
                    </div>
                  </td>
                  <td data-rotulo="Agora">
                    <Situacao entregador={e} agora={agora} />
                  </td>
                  <td data-rotulo="Entregas">{e.entregasFeitas}</td>
                  <td data-rotulo="Ativo">
                    <button
                      type="button"
                      className={`interruptor ${e.ativo ? "interruptor--ligado" : ""}`}
                      onClick={() => definirEntregadorAtivo(e.id, !e.ativo)}
                      aria-pressed={e.ativo}
                      aria-label={`${e.ativo ? "Desativar" : "Ativar"} ${e.nome}`}
                    >
                      <span />
                    </button>
                  </td>
                  <td className="tabela--direita" data-rotulo="Ações">
                    <div className="celula-acoes">
                      <button
                        type="button"
                        className="btn btn--fantasma btn--pequeno"
                        onClick={() =>
                          setEditando({ ...VAZIO, ...e, senha: "", novo: false })
                        }
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn--fantasma btn--pequeno tabela__perigo"
                        onClick={() => excluir(e)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <FormularioEntregador
          entregador={editando}
          aoFechar={() => setEditando(null)}
        />
      )}
    </>
  );
}

function Situacao({ entregador, agora }) {
  if (!entregador.ativo) return <span className="selo">Inativo</span>;
  if (entregador.naRua.length === 0) {
    return <span className="selo selo--basil">Livre</span>;
  }

  return (
    <div>
      <span className="selo selo--quente tabela__data">
        Na rua: {entregador.naRua.map((p) => p.id).join(", ")}
      </span>
      <span className="tabela__secundario">
        {entregador.posicao
          ? `posição de ${haQuantoTempo(entregador.posicao.em, agora)}`
          : "sem posição no momento"}
      </span>
    </div>
  );
}

function FormularioEntregador({ entregador, aoFechar }) {
  const { salvarEntregador } = usePainel();
  const [form, setForm] = useState(entregador);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);

  const definir = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
    setErroGeral("");
  };

  // As regras de cada campo são conferidas pelo servidor, que devolve o erro
  // de cada um.
  const salvar = async (evento) => {
    evento.preventDefault();
    const { nome, telefone, veiculo, placa, senha } = form;

    setSalvando(true);
    try {
      await salvarEntregador({
        ...(entregador.novo ? {} : { id: entregador.id }),
        nome,
        telefone,
        veiculo,
        placa,
        senha,
      });
      aoFechar();
    } catch (erro) {
      setErros(erro.campos ?? {});
      setErroGeral(erro.campos ? "Confira os campos destacados." : erro.message);
      setSalvando(false);
    }
  };

  const campo = (nome, rotulo, extras = {}) => (
    <label className={`campo ${extras.largo ? "campo--largo" : ""}`}>
      <span className="campo__rotulo">{rotulo}</span>
      <input
        className="campo__entrada"
        value={form[nome]}
        aria-invalid={erros[nome] ? "true" : undefined}
        onChange={(e) =>
          definir(nome, extras.mascara ? extras.mascara(e.target.value) : e.target.value)
        }
        {...extras.entrada}
      />
      {erros[nome] && <span className="campo__erro">{erros[nome]}</span>}
    </label>
  );

  return (
    <div
      className="sobreposicao"
      onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}
    >
      <form
        className="modal modal--form"
        role="dialog"
        aria-modal="true"
        onSubmit={salvar}
        noValidate
      >
        <button
          type="button"
          className="modal__fechar"
          onClick={aoFechar}
          aria-label="Fechar"
        >
          <IconeFechar />
        </button>

        <div className="modal__conteudo modal__conteudo--form">
          <h2 className="modal__titulo">
            {entregador.novo ? "Novo entregador" : "Editar entregador"}
          </h2>

          <div className="malha">
            {campo("nome", "Nome completo", {
              largo: true,
              entrada: { maxLength: 80, autoComplete: "off" },
            })}
            {campo("telefone", "Telefone com DDD", {
              mascara: mascaraTelefone,
              entrada: { inputMode: "tel", placeholder: "(83) 99999-0000", autoComplete: "off" },
            })}
            {campo("placa", "Placa", {
              mascara: (v) => v.toUpperCase(),
              entrada: { maxLength: 8, placeholder: "ABC1D23", autoComplete: "off" },
            })}
            {campo("veiculo", "Veículo", {
              largo: true,
              entrada: { maxLength: 40, placeholder: "Honda CG 160 vermelha", autoComplete: "off" },
            })}
            {campo(
              "senha",
              entregador.novo
                ? "Senha de acesso"
                : "Nova senha (em branco para manter a atual)",
              { largo: true, entrada: { maxLength: 72, autoComplete: "off" } },
            )}
          </div>

          <p className="modal__descricao">
            O entregador entra em <strong>/entregador</strong> com o telefone e
            a senha. A senha precisa de pelo menos 8 caracteres, com letras e
            números.
          </p>

          {erroGeral && (
            <p className="campo__erro" role="alert">
              {erroGeral}
            </p>
          )}

          <div className="modal__acoes modal__acoes--form">
            <button type="button" className="btn btn--fantasma" onClick={aoFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--ambar" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar entregador"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
