'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Download, FileCheck2, Save, Video } from 'lucide-react';
import { mudarStatusProposta, salvarProposta, type EstadoProposta } from '@/lib/propostas/actions';
import type { PropostaCompleta, StatusProposta } from '@/lib/propostas/queries';
import { centavosParaCampo, type DocumentoProposta } from '@/lib/propostas/schema';
import {
  PROXIMA_ACAO_STATUS,
  ROTULO_ACAO_STATUS,
  ROTULO_STATUS_PROPOSTA,
} from '@/lib/propostas/status';
import { PreviewProposta } from './PreviewProposta';
import { SecoesContextoEntrega } from './SecoesContextoEntrega';
import { SecoesPrazoDecisao } from './SecoesPrazoDecisao';
import { AcaoEntrega } from './AcaoEntrega';
import { CompartilharProposta } from './CompartilharProposta';
import styles from './EditorProposta.module.css';

const INICIAL: EstadoProposta = {};

export function EditorProposta({
  id,
  tituloInicial,
  documentoInicial,
  statusInicial,
  versaoInicial,
  oportunidadeId,
  reuniaoId,
  execucaoId,
  compartilhamentoInicial,
  siteUrl,
}: {
  id: string;
  tituloInicial: string;
  documentoInicial: DocumentoProposta;
  statusInicial: StatusProposta;
  versaoInicial: number;
  oportunidadeId: string;
  reuniaoId: string | null;
  execucaoId: string | null;
  compartilhamentoInicial: PropostaCompleta['compartilhamento'];
  siteUrl: string;
}) {
  const [titulo, setTitulo] = useState(tituloInicial);
  const [documento, setDocumento] = useState(documentoInicial);
  const [valor, setValor] = useState(
    centavosParaCampo(documentoInicial.investimento.valorCentavos),
  );
  const [sujo, setSujo] = useState(false);
  const [estadoSalvar, acaoSalvar, salvando] = useActionState(
    async (estado: EstadoProposta, dados: FormData) => {
      const resultado = await salvarProposta(estado, dados);
      if (resultado.sucesso) setSujo(false);
      return resultado;
    },
    INICIAL,
  );
  const [estadoStatus, acaoStatus, atualizandoStatus] = useActionState(
    mudarStatusProposta,
    INICIAL,
  );

  const estadoAtual =
    (estadoStatus.versao ?? 0) > (estadoSalvar.versao ?? 0) ? estadoStatus : estadoSalvar;
  const status = estadoAtual.status ?? statusInicial;
  const versao = estadoAtual.versao ?? versaoInicial;
  const compartilhamentoCodigo =
    estadoStatus.compartilhamentoCodigo ?? compartilhamentoInicial.codigo;
  const json = useMemo(() => JSON.stringify(documento), [documento]);
  const proximoStatus = PROXIMA_ACAO_STATUS[status];
  const descricaoEstado = sujo
    ? 'Salve as alterações antes de avançar ou baixar o PDF.'
    : status === 'pronta'
      ? 'Quando você apresentar ao cliente, registre aqui para atualizar a venda.'
      : status === 'apresentada'
        ? 'Registre a decisão do cliente. Ao aceitar, a plataforma cria o projeto e abre a execução.'
        : status === 'aceita'
          ? execucaoId
            ? 'O projeto do cliente já está aberto com o escopo aprovado.'
            : 'Venda confirmada. Abra o projeto para começar a entrega.'
          : status === 'recusada'
            ? 'A recusa foi registrada na venda. Crie outra versão somente se a negociação mudar.'
            : 'Altere o status conforme a proposta avançar com o cliente.';

  function mudar(mutacao: (atual: DocumentoProposta) => DocumentoProposta) {
    setDocumento((atual) => mutacao(atual));
    setSujo(true);
  }

  return (
    <div className={styles.pagina}>
      <header className={styles.barra}>
        <div className={styles.identidade}>
          <Link href="/propostas" aria-label="Voltar às propostas">
            <ArrowLeft size={17} strokeWidth={1.9} aria-hidden="true" />
          </Link>
          <div>
            <span className={styles.status} data-status={status}>
              {ROTULO_STATUS_PROPOSTA[status]}
            </span>
            <small>V{versao.toString().padStart(2, '0')}</small>
          </div>
        </div>

        <div className={styles.acoesTopo}>
          {reuniaoId && (
            <Link href={`/reunioes/${reuniaoId}`} className={styles.secundario}>
              <Video size={15} aria-hidden="true" /> Call de origem
            </Link>
          )}
          <Link href={`/vendas/${oportunidadeId}`} className={styles.secundario}>
            Ver lead
          </Link>
          {sujo ? (
            <span className={styles.downloadInativo} title="Salve antes de baixar">
              <Download size={15} aria-hidden="true" /> PDF
            </span>
          ) : (
            <a href={`/api/propostas/${id}/pdf`} className={styles.secundario}>
              <Download size={15} aria-hidden="true" /> PDF
            </a>
          )}
          <form action={acaoSalvar}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="titulo" value={titulo} />
            <input type="hidden" name="documento" value={json} />
            <button type="submit" className={styles.salvar} disabled={salvando || !sujo}>
              {salvando ? (
                <span className={styles.spinner} />
              ) : !sujo ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <Save size={15} aria-hidden="true" />
              )}
              {salvando ? 'Salvando' : sujo ? 'Salvar versão' : 'Salvo'}
            </button>
          </form>
        </div>
      </header>

      {(estadoSalvar.erro || estadoStatus.erro) && (
        <p className={styles.aviso} role="alert">
          {estadoSalvar.erro ?? estadoStatus.erro}
        </p>
      )}
      {(estadoSalvar.sucesso || estadoStatus.sucesso) && !sujo && (
        <p className={styles.confirmacao} role="status">
          <Check size={14} aria-hidden="true" /> {estadoSalvar.sucesso ?? estadoStatus.sucesso}
        </p>
      )}

      <div className={styles.grade}>
        <main className={styles.editor}>
          <section className={styles.abertura}>
            <p className={styles.sobretitulo}>Documento comercial</p>
            <textarea
              aria-label="Título interno da proposta"
              className={styles.tituloDocumento}
              value={titulo}
              rows={2}
              maxLength={180}
              onChange={(evento) => {
                setTitulo(evento.target.value);
                setSujo(true);
              }}
            />
            <p>
              Revise a leitura que o cliente verá. O PDF acompanha esta prévia e só usa o que foi
              salvo.
            </p>
          </section>

          <SecoesContextoEntrega documento={documento} mudar={mudar} />
          <SecoesPrazoDecisao
            documento={documento}
            mudar={mudar}
            valor={valor}
            setValor={setValor}
          />

          <section className={styles.decisao}>
            <div className={styles.estadoDocumento}>
              <FileCheck2 size={21} strokeWidth={1.7} aria-hidden="true" />
              <div>
                <p className={styles.sobretitulo}>Estado do documento</p>
                <h2>{ROTULO_STATUS_PROPOSTA[status]}</h2>
                <p>{descricaoEstado}</p>
              </div>
            </div>

            <div className={styles.controlesDecisao}>
              {compartilhamentoCodigo && ['apresentada', 'aceita', 'recusada'].includes(status) && (
                <CompartilharProposta
                  codigo={compartilhamentoCodigo}
                  siteUrl={siteUrl}
                  empresa={documento.cliente.empresa}
                  email={documento.cliente.email}
                  projeto={documento.projeto.titulo}
                  status={status}
                  compartilhamento={compartilhamentoInicial}
                />
              )}
              <form action={acaoStatus} className={styles.acoesStatus}>
                <input type="hidden" name="id" value={id} />
                {proximoStatus && (
                  <button
                    type="submit"
                    name="status"
                    value={proximoStatus}
                    disabled={sujo || atualizandoStatus}
                    className={styles.avancar}
                  >
                    {ROTULO_ACAO_STATUS[status]}
                  </button>
                )}
                {status === 'apresentada' && (
                  <>
                    <p className={styles.automacaoEntrega}>
                      Ao confirmar, a plataforma cria o Projeto, leva o escopo aprovado e abre a
                      execução deste cliente.
                    </p>
                    <button
                      type="submit"
                      name="status"
                      value="aceita"
                      disabled={sujo || atualizandoStatus}
                      className={styles.avancar}
                    >
                      Confirmar venda e iniciar Projeto
                    </button>
                    <button
                      type="submit"
                      name="status"
                      value="recusada"
                      disabled={sujo || atualizandoStatus}
                      className={styles.secundario}
                    >
                      Não aprovada
                    </button>
                  </>
                )}
                {(status === 'aceita' || status === 'recusada') && (
                  <button
                    type="submit"
                    name="status"
                    value="rascunho"
                    disabled={sujo || atualizandoStatus}
                    className={styles.secundario}
                  >
                    Criar nova versão
                  </button>
                )}
              </form>
              {status === 'aceita' && <AcaoEntrega propostaId={id} execucaoId={execucaoId} />}
            </div>
          </section>
        </main>

        <PreviewProposta documento={documento} titulo={titulo} versao={versao} status={status} />
      </div>
    </div>
  );
}
