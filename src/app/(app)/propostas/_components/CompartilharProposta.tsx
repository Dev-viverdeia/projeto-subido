'use client';

import { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Eye, Mail } from 'lucide-react';
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
  }).format(new Date(valor));
}

export function CompartilharProposta({
  codigo,
  siteUrl,
  empresa,
  email,
  projeto,
  status,
  compartilhamento,
}: {
  codigo: string;
  siteUrl: string;
  empresa: string;
  email: string | null;
  projeto: string;
  status: StatusProposta;
  compartilhamento: Compartilhamento;
}) {
  const [copiado, setCopiado] = useState(false);
  const url = useMemo(() => new URL(`/proposta/${codigo}`, siteUrl).toString(), [codigo, siteUrl]);
  const assunto = `Proposta comercial · ${projeto}`;
  const corpo = `Olá! Preparei a proposta do projeto ${projeto} para ${empresa}.\n\nVocê pode revisar o escopo, investimento e registrar sua decisão por este link seguro:\n${url}`;
  const mailto = `mailto:${email ?? ''}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  const ultimaVisualizacao = dataCurta(compartilhamento.ultimaVisualizacaoEm);

  function copiar() {
    void navigator.clipboard.writeText(url).then(() => {
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2200);
    });
  }

  return (
    <div className={styles.compartilhamento}>
      <div className={styles.compartilhamentoTopo}>
        <div>
          <p className={styles.sobretitulo}>Link do cliente</p>
          <h3>
            {status === 'apresentada' ? 'Proposta pronta para decisão' : 'Decisão registrada'}
          </h3>
          <p>O cliente acessa sem login e a visualização entra automaticamente no histórico.</p>
        </div>
        <span className={styles.metricaVisualizacao}>
          <Eye size={15} aria-hidden="true" />
          {compartilhamento.visualizacoes}
          <small>{compartilhamento.visualizacoes === 1 ? 'visualização' : 'visualizações'}</small>
        </span>
      </div>

      <div className={styles.linkPublico}>
        <span>{url}</span>
        <button type="button" onClick={copiar}>
          {copiado ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          {copiado ? 'Copiado' : 'Copiar link'}
        </button>
      </div>

      <div className={styles.acoesCompartilhamento}>
        <a href={mailto}>
          <Mail size={15} aria-hidden="true" /> Preparar e-mail
        </a>
        <a href={url} target="_blank" rel="noreferrer">
          <ExternalLink size={15} aria-hidden="true" /> Abrir como cliente
        </a>
        {ultimaVisualizacao && <span>Última abertura em {ultimaVisualizacao}</span>}
      </div>

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
