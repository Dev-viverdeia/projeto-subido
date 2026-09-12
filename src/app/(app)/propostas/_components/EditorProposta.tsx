'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  Eye,
  FileCheck2,
  Pencil,
  Save,
  Video,
} from 'lucide-react';
import { Spinner } from '@/design-system/via';
import { mudarStatusProposta, salvarProposta, type EstadoProposta } from '@/lib/propostas/actions';
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
  referenciaEm,
  alteracaoInicial = false,
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
}) {
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
  const [estadoSalvar, acaoSalvar, salvando] = useActionState(
    async (estado: EstadoProposta, dados: FormData) => {
      const resultado = await salvarProposta(estado, dados);
      // A resposta confirma o conteúdo enviado, não o que foi digitado durante a espera.
      if (resultado.sucesso) {
        setConteudoSalvo(JSON.stringify([dados.get('titulo'), dados.get('documento')]));
      }
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
  const sujo = JSON.stringify([titulo, json]) !== conteudoSalvo;
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
      status={status}
      acao={acaoStatus}
      bloqueado={sujo || salvando}
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
          {sujo || salvando ? (
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
                <span aria-hidden="true">
                  <Spinner size="sm" tone="inverse" />
                </span>
              ) : !sujo ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <Save size={15} aria-hidden="true" />
              )}
              {salvando ? 'Salvando' : sujo ? 'Salvar alterações' : 'Salvo'}
            </button>
          </form>
        </div>
      </header>

      {acompanhar && compartilhamentoCodigo ? (
        <CompartilharProposta
          key={`${compartilhamentoCodigo}:${status}`}
          propostaId={id}
          codigo={compartilhamentoCodigo}
          siteUrl={siteUrl}
          empresa={documento.cliente.empresa}
          email={documento.cliente.email}
          projeto={documento.projeto.titulo}
          status={status}
          alteracoesPendentes={sujo || salvando}
          compartilhamento={{
            ...compartilhamentoInicial,
            ativo: estadoStatus.compartilhamentoCodigo ? true : compartilhamentoInicial.ativo,
          }}
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
        continuidadeEntrega
      )}

      {(estadoSalvar.erro || estadoStatus.erro) && (
        <RetornoOperacao
          tom="erro"
          titulo="A proposta não foi atualizada"
          descricao={estadoSalvar.erro ?? estadoStatus.erro}
        />
      )}
      {(estadoSalvar.sucesso || estadoStatus.sucesso) && !sujo && (
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
        <form action={acaoSalvar} className={styles.salvarMobile}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="titulo" value={titulo} />
          <input type="hidden" name="documento" value={json} />
          <button type="submit" disabled={salvando || !sujo} aria-live="polite">
            {salvando ? (
              <span aria-hidden="true">
                <Spinner size="sm" tone="inverse" />
              </span>
            ) : !sujo ? (
              <Check size={15} aria-hidden="true" />
            ) : (
              <Save size={15} aria-hidden="true" />
            )}
            {salvando ? 'Salvando' : sujo ? 'Salvar' : 'Salvo'}
          </button>
        </form>
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
