'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, Plus, Search, X } from 'lucide-react';
import type { ResumoProposta } from '@/lib/propostas/queries';
import { formatarReais } from '@/lib/propostas/schema';
import { ROTULO_STATUS_PROPOSTA } from '@/lib/propostas/status';
import { AbasFiltro } from '../../_components/filtros/AbasFiltro';
import styles from '../pagina.module.css';

type FiltroProposta = 'todas' | 'rascunhos' | 'enviadas';

function dataCurta(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function ehRascunho(proposta: ResumoProposta): boolean {
  return proposta.status === 'rascunho' || proposta.status === 'pronta';
}

function CardProposta({ proposta }: { proposta: ResumoProposta }) {
  const rascunho = ehRascunho(proposta);

  return (
    <Link href={`/propostas/${proposta.id}`} className={styles.card}>
      <div className={styles.cardPrincipal}>
        <span className={styles.status} data-status={proposta.status}>
          {ROTULO_STATUS_PROPOSTA[proposta.status]}
        </span>
        <div className={styles.cardTitulo}>
          <p>{proposta.empresa}</p>
          <h3>{proposta.titulo}</h3>
          <span>{proposta.projeto}</span>
        </div>
      </div>

      <div className={styles.cardValor}>
        <span>Valor</span>
        <strong>{formatarReais(proposta.valorCentavos)}</strong>
      </div>

      <div className={styles.cardAtualizacao}>
        <span>Atualizada</span>
        <strong>{dataCurta(proposta.atualizadoEm)}</strong>
        <small>Versão {proposta.versao}</small>
      </div>

      <span className={styles.cardAcao}>
        {rascunho ? 'Editar' : 'Abrir'}
        <ArrowRight size={16} strokeWidth={1.9} aria-hidden="true" />
      </span>
    </Link>
  );
}

function normalizarBusca(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

export function PainelPropostas({ propostas }: { propostas: ResumoProposta[] }) {
  const [filtro, setFiltro] = useState<FiltroProposta>('todas');
  const [busca, setBusca] = useState('');
  const rascunhos = propostas.filter(ehRascunho);
  const enviadas = propostas.filter((proposta) => !ehRascunho(proposta));

  const propostasVisiveis = useMemo(() => {
    const termo = normalizarBusca(busca);
    return propostas.filter((proposta) => {
      const noFiltro =
        filtro === 'todas' ||
        (filtro === 'rascunhos' && ehRascunho(proposta)) ||
        (filtro === 'enviadas' && !ehRascunho(proposta));
      if (!noFiltro) return false;
      if (!termo) return true;
      return normalizarBusca(`${proposta.empresa} ${proposta.titulo} ${proposta.projeto}`).includes(
        termo,
      );
    });
  }, [busca, filtro, propostas]);

  const vazioPorBusca = Boolean(busca.trim()) && propostasVisiveis.length === 0;
  const tituloVazio = vazioPorBusca
    ? 'Nenhuma proposta encontrada'
    : filtro === 'rascunhos'
      ? 'Nenhuma proposta em rascunho'
      : filtro === 'enviadas'
        ? 'Nenhuma proposta enviada ainda'
        : 'Nenhuma proposta criada ainda';
  const descricaoVazio = vazioPorBusca
    ? 'Tente buscar pelo nome da empresa, da proposta ou do projeto.'
    : filtro === 'enviadas'
      ? 'Quando uma proposta for enviada, ela aparecerá aqui com a decisão do cliente.'
      : 'Crie uma proposta para preparar escopo, prazo e investimento.';

  return (
    <div className={styles.pagina}>
      <header className={styles.hero}>
        <div className={styles.heroTexto}>
          <span className={styles.sobretitulo}>Propostas</span>
          <h1>Biblioteca comercial</h1>
          <p>Crie, revise e acompanhe cada proposta.</p>
        </div>
        <Link href="/propostas/nova" className={styles.nova}>
          <Plus size={17} strokeWidth={2} aria-hidden="true" />
          Nova proposta
        </Link>
      </header>

      <section className={styles.arquivo} aria-labelledby="titulo-arquivo-propostas">
        <header className={styles.arquivoTopo}>
          <div>
            <span className={styles.sobretitulo}>Arquivo</span>
            <h2 id="titulo-arquivo-propostas">Suas propostas</h2>
          </div>
          <span className={styles.totalArquivo}>
            {propostas.length} {propostas.length === 1 ? 'proposta' : 'propostas'}
          </span>
        </header>

        <div className={styles.ferramentas}>
          <AbasFiltro
            abas={[
              { id: 'todas', rotulo: 'Todas', total: propostas.length },
              { id: 'rascunhos', rotulo: 'Rascunhos', total: rascunhos.length },
              { id: 'enviadas', rotulo: 'Enviadas', total: enviadas.length },
            ]}
            ativa={filtro}
            aoMudar={(id) => setFiltro(id as FiltroProposta)}
            layoutId="filtro-biblioteca-propostas"
            ariaLabel="Filtrar propostas"
          />

          <label className={styles.busca}>
            <span className="sr-only">Buscar propostas</span>
            <Search size={17} strokeWidth={1.8} aria-hidden="true" />
            <input
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar empresa ou proposta"
              autoComplete="off"
            />
            {busca && (
              <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca">
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </label>
        </div>

        {propostasVisiveis.length > 0 ? (
          <div className={styles.lista} aria-live="polite">
            {propostasVisiveis.map((proposta) => (
              <CardProposta proposta={proposta} key={proposta.id} />
            ))}
          </div>
        ) : (
          <div className={styles.vazio} aria-live="polite">
            <span className={styles.vazioIcone} aria-hidden="true">
              <FileText size={21} strokeWidth={1.6} />
            </span>
            <div>
              <h3>{tituloVazio}</h3>
              <p>{descricaoVazio}</p>
            </div>
            {vazioPorBusca ? (
              <button type="button" className={styles.limparVazio} onClick={() => setBusca('')}>
                Limpar busca
              </button>
            ) : filtro !== 'enviadas' ? (
              <Link href="/propostas/nova" className={styles.acaoVazia}>
                Criar proposta <ArrowRight size={15} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
