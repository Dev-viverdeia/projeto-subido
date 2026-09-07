'use client';

import { useActionState, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Eye, Link2Off, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/design-system/via';
import { ModalOperacao } from '@/app/(app)/_components/ModalOperacao';
import {
  configurarLinkProposta,
  type EstadoCompartilhamento,
} from '@/lib/propostas/compartilhamento-actions';
import type { PropostaCompleta, StatusProposta } from '@/lib/propostas/queries';
import styles from './EditorProposta.module.css';

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
}: {
  propostaId: string;
  codigo: string;
  siteUrl: string;
  empresa: string;
  email: string | null;
  projeto: string;
  status: StatusProposta;
  compartilhamento: Compartilhamento;
}) {
  const [copiado, setCopiado] = useState(false);
  const [operacao, setOperacao] = useState<'desativar' | 'renovar' | null>(null);
  const [erroCopia, setErroCopia] = useState('');
  const [estado, enviar, pendente] = useActionState<EstadoCompartilhamento, FormData>(
    async (anterior, dados) => {
      const resultado = await configurarLinkProposta(anterior, dados);
      if (resultado.sucesso) setOperacao(null);
      return resultado;
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

  function copiar() {
    setErroCopia('');
    void navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopiado(true);
        window.setTimeout(() => setCopiado(false), 2200);
      })
      .catch(() => setErroCopia('Não foi possível copiar. Selecione o link e copie manualmente.'));
  }

  return (
    <div className={styles.compartilhamento}>
      <div className={styles.compartilhamentoTopo}>
        <div>
          <p className={styles.sobretitulo}>Link do cliente</p>
          <h3>
            {status === 'apresentada' ? 'Proposta pronta para decisão' : 'Decisão registrada'}
          </h3>
          <p>
            {ativo
              ? 'Acesso sem login. Compartilhe apenas com seu cliente.'
              : 'Link desativado. O status e a decisão da proposta foram preservados.'}
          </p>
        </div>
        <span className={styles.metricaVisualizacao}>
          <Eye size={15} aria-hidden="true" />
          {compartilhamento.visualizacoes}
          <small>{compartilhamento.visualizacoes === 1 ? 'visualização' : 'visualizações'}</small>
        </span>
      </div>

      {ativo && (
        <div className={styles.linkPublico}>
          <span>{url}</span>
          <button type="button" onClick={copiar}>
            {copiado ? (
              <Check size={15} aria-hidden="true" />
            ) : (
              <Copy size={15} aria-hidden="true" />
            )}
            {copiado ? 'Copiado' : 'Copiar link'}
          </button>
        </div>
      )}
      {erroCopia && <p role="alert">{erroCopia}</p>}
      {!operacao && estado.sucesso && <p role="status">{estado.sucesso}</p>}

      <div className={styles.acoesCompartilhamento}>
        {ativo && (
          <>
            <a href={mailto}>
              <Mail size={15} aria-hidden="true" /> Preparar e-mail
            </a>
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink size={15} aria-hidden="true" /> Abrir como cliente
            </a>
          </>
        )}
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
        {ultimaVisualizacao && <span>Última abertura em {ultimaVisualizacao}</span>}
      </div>
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

      {compartilhamento.decisaoNome && (
        <div className={styles.retornoCliente}>
          <Check size={17} aria-hidden="true" />
          <div>
            <strong>
              {status === 'aceita' ? 'Aprovada' : 'Recusada'} por {compartilhamento.decisaoNome}
            </strong>
            <span>
              {compartilhamento.decisaoEmail}
              {compartilhamento.decididaEm ? ` · ${dataCurta(compartilhamento.decididaEm)}` : ''}
            </span>
            {compartilhamento.decisaoComentario && <p>“{compartilhamento.decisaoComentario}”</p>}
          </div>
        </div>
      )}
    </div>
  );
}
