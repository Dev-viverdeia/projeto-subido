'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Download, FileCheck2, Save } from 'lucide-react';
import { mudarStatusProposta, salvarProposta, type EstadoProposta } from '@/lib/propostas/actions';
import type { StatusProposta } from '@/lib/propostas/queries';
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
import styles from './EditorProposta.module.css';

const INICIAL: EstadoProposta = {};

export function EditorProposta({
  id,
  tituloInicial,
  documentoInicial,
  statusInicial,
  versaoInicial,
  oportunidadeId,
  execucaoId,
}: {
  id: string;
  tituloInicial: string;
  documentoInicial: DocumentoProposta;
  statusInicial: StatusProposta;
  versaoInicial: number;
  oportunidadeId: string;
  execucaoId: string | null;
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
  const json = useMemo(() => JSON.stringify(documento), [documento]);
  const proximoStatus = PROXIMA_ACAO_STATUS[status];

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
          <Link href={`/crm/${oportunidadeId}`} className={styles.secundario}>
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
                <p>
                  {sujo
                    ? 'Salve as alterações antes de avançar ou baixar o PDF.'
                    : status === 'pronta'
                      ? 'Quando você apresentar ao cliente, registre aqui para alimentar o CRM.'
                      : 'Cada mudança de estado vira um fato na jornada deste lead.'}
                </p>
              </div>
            </div>

            <div className={styles.controlesDecisao}>
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
                    <button
                      type="submit"
                      name="status"
                      value="aceita"
                      disabled={sujo || atualizandoStatus}
                      className={styles.avancar}
                    >
                      Marcar como aceita
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
