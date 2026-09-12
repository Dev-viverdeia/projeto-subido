'use client';

import { useActionState, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  Link2Off,
  Mail,
  RefreshCw,
  X,
} from 'lucide-react';
import { Button } from '@/design-system/via';
import { ModalOperacao } from '@/app/(app)/_components/ModalOperacao';
import {
  configurarLinkProposta,
  type EstadoCompartilhamento,
} from '@/lib/propostas/compartilhamento-actions';
import type { PropostaCompleta, StatusProposta } from '@/lib/propostas/queries';
import styles from './CompartilharProposta.module.css';

type Compartilhamento = PropostaCompleta['compartilhamento'];

function dataCurta(valor: string | null): string | null {
  if (!valor) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(valor));
}

export function CompartilharProposta({
  propostaId,
  codigo,
  siteUrl,
  empresa,
  email,
  projeto,
  status,
  compartilhamento,
  alteracoesPendentes = false,
  acoes,
}: {
  propostaId: string;
  codigo: string;
  siteUrl: string;
  empresa: string;
  email: string | null;
  projeto: string;
  status: StatusProposta;
  compartilhamento: Compartilhamento;
  alteracoesPendentes?: boolean;
  acoes?: ReactNode;
}) {
  const [copiado, setCopiado] = useState<string | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [operacao, setOperacao] = useState<'desativar' | 'renovar' | null>(null);
  const [erroCopia, setErroCopia] = useState('');
  const [estado, enviar, pendente] = useActionState<EstadoCompartilhamento, FormData>(
    async (anterior, dados) => {
      try {
        const resultado = await configurarLinkProposta(anterior, dados);
        if (resultado.sucesso) setOperacao(null);
        return { ...anterior, sucesso: undefined, erro: undefined, ...resultado };
      } catch {
        return {
          ...anterior,
          sucesso: undefined,
          erro: 'Não conseguimos confirmar a alteração. Tente novamente.',
        };
      }
    },
    {},
  );
  const codigoAtual = estado.codigo ?? codigo;
  const ativo = estado.ativo ?? compartilhamento.ativo;
  const url = useMemo(
    () => new URL(`/proposta/${codigoAtual}`, siteUrl).toString(),
    [codigoAtual, siteUrl],
  );
  const assunto = `Proposta comercial · ${projeto}`;
  const corpo = `Olá! Preparei a proposta do projeto ${projeto} para ${empresa}.\n\nVocê pode revisar o escopo, investimento e registrar sua decisão por este link seguro:\n${url}`;
  const mailto = `mailto:${email ?? ''}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  const ultimaVisualizacao = dataCurta(compartilhamento.ultimaVisualizacaoEm);
  const decidida = status === 'aceita' || status === 'recusada';
  const Icone = status === 'aceita' ? Check : status === 'recusada' ? X : Mail;

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  async function copiar() {
    setErroCopia('');
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(url);
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => setCopiado(null), 2200);
    } catch {
      setErroCopia('Não foi possível copiar. Selecione o link e copie manualmente.');
    }
  }

  return (
    <section className={styles.painel} aria-label="Acompanhar proposta">
      <div className={styles.principal}>
        <div className={styles.resumo}>
          <div className={styles.titulo}>
            <span className={styles.icone} data-decidida={decidida || undefined}>
              <Icone size={21} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <h2>
                {status === 'aceita'
                  ? 'Proposta aceita'
                  : status === 'recusada'
                    ? 'Proposta não aprovada'
                    : 'Aguardando resposta'}
              </h2>
              {decidida && (
                <p>
                  {compartilhamento.decisaoNome
                    ? `Resposta de ${compartilhamento.decisaoNome}`
                    : status === 'aceita'
                      ? 'Aceite registrado na venda'
                      : 'Recusa registrada na venda'}
                </p>
              )}
            </div>
          </div>
          <div className={styles.visualizacoes}>
            <span>
              <Eye size={16} aria-hidden="true" />
              {compartilhamento.visualizacoes === 0
                ? 'Sem visualizações'
                : `${compartilhamento.visualizacoes} ${compartilhamento.visualizacoes === 1 ? 'visualização' : 'visualizações'}`}
            </span>
            {ultimaVisualizacao && <span>Última abertura: {ultimaVisualizacao}</span>}
          </div>
        </div>
        <div className={styles.compartilhar}>
          {ativo ? (
            <>
              <div className={styles.linkPublico}>
                <input
                  aria-label="Link da proposta"
                  value={url}
                  readOnly
                  onFocus={(evento) => evento.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={() => {
                    void copiar();
                  }}
                  disabled={alteracoesPendentes}
                  aria-live="polite"
                >
                  {copiado === url ? (
                    <Check size={17} aria-hidden="true" />
                  ) : (
                    <Copy size={17} aria-hidden="true" />
                  )}
                  {copiado === url ? 'Copiado' : 'Copiar link'}
                </button>
              </div>
              {alteracoesPendentes && (
                <p className={styles.aviso} role="status">
                  Salve para compartilhar a versão atual.
                </p>
              )}
              <div className={styles.acoesLink}>
                {!alteracoesPendentes && (
                  <a href={mailto}>
                    <Mail size={16} aria-hidden="true" /> Preparar e-mail
                  </a>
                )}
                <a href={url} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} aria-hidden="true" />
                  {alteracoesPendentes ? 'Abrir versão salva' : 'Abrir proposta'}
                </a>
              </div>
            </>
          ) : (
            <div className={styles.desativado}>
              <Link2Off size={20} aria-hidden="true" />
              <div>
                <strong>Link desativado</strong>
                <p>A proposta e a decisão continuam salvas.</p>
              </div>
              <button
                type="button"
                className={styles.novoLink}
                onClick={(evento) => {
                  evento.currentTarget.focus();
                  setOperacao('renovar');
                }}
              >
                Criar novo link
              </button>
            </div>
          )}
          {erroCopia && (
            <p className={styles.aviso} role="alert">
              {erroCopia}
            </p>
          )}
          {!operacao && estado.sucesso && (
            <p className={styles.aviso} role="status">
              {estado.sucesso}
            </p>
          )}
        </div>
      </div>
      <div className={styles.rodape}>
        {acoes && <div className={styles.acoesVenda}>{acoes}</div>}
        <details className={styles.acesso}>
          <summary>
            Gerenciar acesso <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <div className={styles.opcoesAcesso}>
            <p>O link abre sem login. Compartilhe apenas com seu cliente.</p>
            <button
              type="button"
              onClick={(evento) => {
                evento.currentTarget.focus();
                setOperacao('renovar');
              }}
            >
              <RefreshCw size={16} aria-hidden="true" /> {ativo ? 'Trocar link' : 'Criar novo link'}
            </button>
            {ativo && (
              <button
                type="button"
                onClick={(evento) => {
                  evento.currentTarget.focus();
                  setOperacao('desativar');
                }}
              >
                <Link2Off size={16} aria-hidden="true" /> Desativar link
              </button>
            )}
          </div>
        </details>
      </div>
      {decidida && compartilhamento.decisaoNome && (
        <details className={styles.resposta}>
          <summary>
            Ver resposta do cliente <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <div>
            {(compartilhamento.decisaoEmail || compartilhamento.decididaEm) && (
              <p className={styles.autoria}>
                {[compartilhamento.decisaoEmail, dataCurta(compartilhamento.decididaEm)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            {compartilhamento.decisaoComentario ? (
              <blockquote>{compartilhamento.decisaoComentario}</blockquote>
            ) : (
              <p className={styles.autoria}>Sem comentário adicional.</p>
            )}
          </div>
        </details>
      )}
      <ModalOperacao
        open={operacao !== null}
        onClose={() => setOperacao(null)}
        title={operacao === 'desativar' ? 'Desativar acesso do cliente?' : 'Criar um novo link?'}
        description={
          operacao === 'desativar'
            ? 'O link atual deixará de abrir a proposta. A venda não muda de status.'
            : 'O link anterior deixará de funcionar. Envie o novo endereço ao cliente.'
        }
        size="sm"
        blocked={pendente}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOperacao(null)} disabled={pendente}>
              Cancelar
            </Button>
            <Button form={`link-proposta-${propostaId}`} type="submit" disabled={pendente}>
              {pendente
                ? 'Salvando…'
                : operacao === 'desativar'
                  ? 'Desativar link'
                  : 'Criar novo link'}
            </Button>
          </>
        }
      >
        <form id={`link-proposta-${propostaId}`} action={enviar}>
          <input type="hidden" name="id" value={propostaId} />
          <input type="hidden" name="codigoAtual" value={codigoAtual} />
          <input type="hidden" name="operacao" value={operacao ?? ''} />
          <p>Quem já recebeu ou baixou a proposta continuará com essa cópia.</p>
          {estado.erro && <p role="alert">{estado.erro}</p>}
        </form>
      </ModalOperacao>
    </section>
  );
}
