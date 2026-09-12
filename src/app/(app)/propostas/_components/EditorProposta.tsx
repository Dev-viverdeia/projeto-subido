'use client';

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  Eye,
  FileCheck2,
  Pencil,
  Video,
} from 'lucide-react';
import type { PropostaCompleta, StatusProposta } from '@/lib/propostas/queries';
import { centavosParaCampo, type DocumentoProposta } from '@/lib/propostas/schema';
import { ROTULO_STATUS_PROPOSTA } from '@/lib/propostas/status';
import { RetornoOperacao } from '../../_components/RetornoOperacao';
import { PreviewProposta } from './PreviewProposta';
import { SecoesContextoEntrega } from './SecoesContextoEntrega';
import { SecoesPrazoDecisao } from './SecoesPrazoDecisao';
import { AcaoEntrega } from './AcaoEntrega';
import { AcoesStatusProposta } from './AcoesStatusProposta';
import { CompartilharProposta } from './CompartilharProposta';
import { usePreviaProposta } from './usePreviaProposta';
import { useAcompanhamentoProposta } from './useAcompanhamentoProposta';
import { AtualizacaoProposta } from './AtualizacaoProposta';
import { useOperacoesProposta } from './useOperacoesProposta';
import { usePosicaoEdicao } from './usePosicaoEdicao';
import { useEdicaoSegura } from './useEdicaoSegura';
import { RevisaoEdicao } from './RevisaoEdicao';
import { SalvarEdicao } from './SalvarEdicao';
import type { EdicaoProposta } from '@/lib/propostas/edicao';
import styles from './EditorProposta.module.css';

const assinarProntidao = () => () => undefined;
const editorPronto = () => true;
const editorNoServidor = () => false;

export function EditorProposta({
  id,
  tituloInicial,
  documentoInicial,
  statusInicial,
  versaoInicial,
  oportunidadeId,
  reuniaoId,
  execucaoId: execucaoIdInicial,
  compartilhamentoInicial,
  siteUrl,
  referenciaEm,
  alteracaoInicial = false,
  sincronizar = true,
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
  referenciaEm: string;
  alteracaoInicial?: boolean;
  sincronizar?: boolean;
}) {
  const pronto = useSyncExternalStore(assinarProntidao, editorPronto, editorNoServidor);
  const [titulo, setTitulo] = useState(tituloInicial);
  const [documento, setDocumento] = useState(documentoInicial);
  const [valor, setValor] = useState(
    centavosParaCampo(documentoInicial.investimento.valorCentavos),
  );
  const [conteudoSalvo, setConteudoSalvo] = useState<string | null>(() =>
    alteracaoInicial ? null : JSON.stringify([tituloInicial, JSON.stringify(documentoInicial)]),
  );
  const {
    editorRef,
    previewRef,
    secaoPreviewRef,
    campoEmFocoRef,
    mostrarSecaoPreview,
    voltarParaEdicao,
    editarSecao,
  } = usePreviaProposta();
  const [painelAtivo, setPainelAtivo] = useState<'editar' | 'preview'>('editar');
  const preservarPosicao = usePosicaoEdicao(editorRef);
  const acompanhamento = useAcompanhamentoProposta(
    {
      id,
      status: statusInicial,
      versao: versaoInicial,
      execucaoId: execucaoIdInicial,
      compartilhamento: compartilhamentoInicial,
    },
    sincronizar,
    preservarPosicao,
  );
  const aplicarEdicao = useCallback(
    (edicao: EdicaoProposta) => {
      setTitulo(edicao.titulo);
      setDocumento(edicao.documento);
      setValor(centavosParaCampo(edicao.documento.investimento.valorCentavos));
      setConteudoSalvo(JSON.stringify([edicao.titulo, JSON.stringify(edicao.documento)]));
      setPainelAtivo('editar');
      requestAnimationFrame(() =>
        editorRef.current?.querySelector<HTMLTextAreaElement>('#titulo-proposta')?.focus(),
      );
    },
    [editorRef],
  );
  const edicao = useEdicaoSegura(
    {
      id,
      titulo: tituloInicial,
      documento: documentoInicial,
      versao: versaoInicial,
      status: statusInicial,
    },
    acompanhamento.dados.versao,
    aplicarEdicao,
    preservarPosicao,
  );
  const { estadoSalvar, acaoSalvar, salvando, estadoStatus, acaoStatus, atualizandoStatus } =
    useOperacoesProposta(acompanhamento, setConteudoSalvo, edicao);

  const { status, versao, execucaoId, compartilhamento } = acompanhamento.dados;
  const compartilhamentoCodigo = compartilhamento.codigo;
  const semAcesso = acompanhamento.falha === 'sessao' || acompanhamento.falha === 'acesso';
  const json = useMemo(() => JSON.stringify(documento), [documento]);
  const sujo = JSON.stringify([titulo, json]) !== conteudoSalvo;
  const salvamento = {
    id,
    versao: edicao.base.versao,
    titulo,
    documento: json,
    acao: acaoSalvar,
    salvando,
    sujo,
    bloqueado: atualizandoStatus || !pronto || semAcesso || edicao.bloqueado,
  };
  const acompanhar = Boolean(
    compartilhamentoCodigo && ['apresentada', 'aceita', 'recusada'].includes(status),
  );
  const descricaoEstado = sujo
    ? 'Salve as alterações antes de avançar ou baixar o PDF.'
    : status === 'pronta'
      ? 'Quando você apresentar ao cliente, registre aqui para atualizar a venda.'
      : status === 'apresentada'
        ? 'Confirme a decisão do cliente para preparar a entrega.'
        : status === 'aceita'
          ? execucaoId
            ? 'O escopo aprovado está na entrega.'
            : 'Venda confirmada. Prepare a entrega com o escopo aprovado.'
          : status === 'recusada'
            ? 'A recusa foi registrada na venda. Crie outra versão somente se a negociação mudar.'
            : 'Altere o status conforme a proposta avançar com o cliente.';

  function mudar(mutacao: (atual: DocumentoProposta) => DocumentoProposta) {
    setDocumento((atual) => mutacao(atual));
  }

  const continuidadeEntrega = status === 'aceita' && !sujo && (
    <section
      className={styles.continuidadeEntrega}
      data-integrada={acompanhar || undefined}
      aria-label="Próximo passo da proposta aceita"
    >
      {!acompanhar && (
        <span className={styles.iconeAceite}>
          <Check size={20} aria-hidden="true" />
        </span>
      )}
      <div>
        <strong>{acompanhar ? 'Próximo passo' : 'Proposta aceita'}</strong>
        <p>
          {execucaoId
            ? 'Continue com o escopo aprovado.'
            : 'Prepare o espaço de trabalho deste cliente.'}
        </p>
      </div>
      <AcaoEntrega propostaId={id} execucaoId={execucaoId} />
    </section>
  );

  const formularioStatus = (
    <AcoesStatusProposta
      id={id}
      versao={edicao.base.versao}
      status={status}
      acao={acaoStatus}
      bloqueado={sujo || salvando || !pronto || semAcesso || edicao.bloqueado}
      pendente={atualizandoStatus}
    />
  );

  return (
    <div className={styles.pagina}>
      <header className={styles.barra}>
        <div className={styles.identidade}>
          <Link href="/propostas" aria-label="Voltar às propostas">
            <ArrowLeft size={17} strokeWidth={1.9} aria-hidden="true" />
          </Link>
          <div className={styles.identidadeTexto}>
            <strong>{documento.cliente.empresa}</strong>
            <div>
              <span className={styles.status} data-status={status}>
                {ROTULO_STATUS_PROPOSTA[status]}
              </span>
              <small>V{versao.toString().padStart(2, '0')}</small>
            </div>
          </div>
        </div>

        <div className={styles.acoesTopo}>
          {reuniaoId && (
            <Link
              href={`/reunioes/${reuniaoId}`}
              className={styles.secundario}
              aria-label="Reunião de origem"
            >
              <Video size={15} aria-hidden="true" /> Reunião
            </Link>
          )}
          <Link href={`/vendas/${oportunidadeId}`} className={styles.secundario}>
            Abrir ficha
          </Link>
          {sujo || salvando || edicao.bloqueado ? (
            <span className={styles.downloadInativo} title="Salve antes de baixar">
              <Download size={15} aria-hidden="true" /> PDF
            </span>
          ) : (
            <a href={`/api/propostas/${id}/pdf`} className={styles.secundario}>
              <Download size={15} aria-hidden="true" /> PDF
            </a>
          )}
          <SalvarEdicao {...salvamento} />
        </div>
      </header>

      <RevisaoEdicao
        edicao={edicao}
        local={{ titulo, documento }}
        salvar={acaoSalvar}
        salvando={salvando || atualizandoStatus}
        semAcesso={semAcesso}
      />

      {acompanhar && compartilhamentoCodigo ? (
        <CompartilharProposta
          propostaId={id}
          codigo={compartilhamentoCodigo}
          siteUrl={siteUrl}
          empresa={documento.cliente.empresa}
          email={documento.cliente.email}
          projeto={documento.projeto.titulo}
          status={status}
          alteracoesPendentes={sujo || salvando || edicao.bloqueado}
          semAcesso={semAcesso}
          compartilhamento={compartilhamento}
          aoIniciarAlteracao={acompanhamento.iniciarAlteracao}
          aoConcluirAlteracao={acompanhamento.concluirAlteracao}
          atualizacao={<AtualizacaoProposta acompanhamento={acompanhamento} />}
          acoes={
            <>
              {continuidadeEntrega}
              <details className={styles.respostaManual}>
                <summary>
                  {status === 'apresentada' ? 'Registrar resposta' : 'Outras opções'}{' '}
                  <ChevronDown size={16} aria-hidden="true" />
                </summary>
                {formularioStatus}
              </details>
            </>
          }
        />
      ) : (
        <>
          {continuidadeEntrega}
          <AtualizacaoProposta acompanhamento={acompanhamento} />
        </>
      )}

      {(estadoSalvar.erro || estadoStatus.erro) && !edicao.aberto && !edicao.bloqueado && (
        <RetornoOperacao
          tom="erro"
          titulo="A proposta não foi atualizada"
          descricao={estadoSalvar.erro ?? estadoStatus.erro}
        />
      )}
      {(estadoSalvar.sucesso || estadoStatus.sucesso) && !sujo && !edicao.bloqueado && (
        <RetornoOperacao
          tom="sucesso"
          titulo={estadoSalvar.sucesso ?? estadoStatus.sucesso ?? 'Proposta atualizada'}
        />
      )}

      <div className={styles.modos}>
        <div className={styles.abasModo} role="group" aria-label="Área de trabalho da proposta">
          <button
            type="button"
            aria-pressed={painelAtivo === 'editar'}
            onClick={() => {
              setPainelAtivo('editar');
              voltarParaEdicao();
            }}
          >
            <Pencil size={15} strokeWidth={1.8} aria-hidden="true" />
            Editar
          </button>
          <button
            type="button"
            aria-pressed={painelAtivo === 'preview'}
            onClick={() => {
              setPainelAtivo('preview');
              requestAnimationFrame(() => mostrarSecaoPreview(secaoPreviewRef.current, true));
            }}
          >
            <Eye size={16} strokeWidth={1.8} aria-hidden="true" />
            Ver prévia
          </button>
        </div>
        <SalvarEdicao {...salvamento} mobile />
      </div>

      <div className={styles.grade}>
        <section
          ref={editorRef}
          className={styles.editor}
          aria-label="Editar proposta"
          data-painel-ativo={painelAtivo === 'editar' || undefined}
          onFocusCapture={(evento) => {
            campoEmFocoRef.current = evento.target;
            const secao = evento.target.closest<HTMLElement>('[data-previa]');
            if (secao?.dataset.previa) mostrarSecaoPreview(secao.dataset.previa);
          }}
          onClickCapture={(evento) => {
            const detalhe = (evento.target as HTMLElement).closest('summary')?.parentElement;
            if (!(detalhe instanceof HTMLDetailsElement)) return;
            requestAnimationFrame(() => {
              if (detalhe.open && detalhe.dataset.previa)
                mostrarSecaoPreview(detalhe.dataset.previa, true);
            });
          }}
        >
          <fieldset className={styles.camposEditaveis} disabled={!pronto} aria-busy={!pronto}>
            <legend className="sr-only">Conteúdo da proposta</legend>
            <section className={styles.abertura}>
              <label htmlFor="titulo-proposta" className={styles.rotuloTitulo}>
                Nome da proposta
              </label>
              <textarea
                id="titulo-proposta"
                data-previa="cliente"
                className={styles.tituloDocumento}
                value={titulo}
                rows={2}
                maxLength={180}
                onChange={(evento) => {
                  setTitulo(evento.target.value);
                }}
              />
            </section>

            <SecoesContextoEntrega documento={documento} mudar={mudar} />
            <SecoesPrazoDecisao
              documento={documento}
              mudar={mudar}
              valor={valor}
              setValor={setValor}
            />

            {!acompanhar && (
              <section className={styles.decisao}>
                <div className={styles.estadoDocumento}>
                  <FileCheck2 size={21} strokeWidth={1.7} aria-hidden="true" />
                  <div>
                    <p className={styles.sobretitulo}>Estado do documento</p>
                    <h2>{ROTULO_STATUS_PROPOSTA[status]}</h2>
                    <p>{descricaoEstado}</p>
                  </div>
                </div>

                <div className={styles.controlesDecisao}>{formularioStatus}</div>
              </section>
            )}
          </fieldset>
        </section>

        <aside
          ref={previewRef}
          className={styles.previewArea}
          aria-label="Prévia da proposta com rolagem"
          tabIndex={0}
          data-painel-ativo={painelAtivo === 'preview' || undefined}
        >
          <PreviewProposta
            onEditar={(secao) => {
              setPainelAtivo('editar');
              editarSecao(secao);
            }}
            referenciaEm={referenciaEm}
            documento={documento}
            titulo={titulo}
            versao={versao}
            status={status}
            sujo={sujo}
          />
        </aside>
      </div>
    </div>
  );
}
