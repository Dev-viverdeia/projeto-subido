'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Eye, FileText, Plus, Search, Send, X } from 'lucide-react';
import type { ResumoProposta } from '@/lib/propostas/queries';
import { formatarReais } from '@/lib/propostas/schema';
import { ROTULO_STATUS_PROPOSTA } from '@/lib/propostas/status';
import { CabecalhoOperacional } from '../../_components/CabecalhoOperacional';
import { AbasFiltro } from '../../_components/filtros/AbasFiltro';
import styles from '../pagina.module.css';

type FiltroProposta = 'todas' | 'rascunhos' | 'enviadas' | 'decididas';

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

function foiDecidida(proposta: ResumoProposta): boolean {
  return proposta.status === 'aceita' || proposta.status === 'recusada';
}

function leituraDaProposta(proposta: ResumoProposta) {
  if (proposta.status === 'rascunho') {
    return {
      rotulo: 'Em construção',
      detalhe: 'Complete o escopo e o investimento',
      acao: 'Editar proposta',
      Icone: FileText,
    };
  }
  if (proposta.status === 'pronta') {
    return {
      rotulo: 'Pronta para enviar',
      detalhe: 'Revise e compartilhe com o cliente',
      acao: 'Compartilhar',
      Icone: Send,
    };
  }
  if (proposta.status === 'apresentada' && proposta.visualizacoes > 0) {
    return {
      rotulo: 'Cliente visualizou',
      detalhe: `${proposta.visualizacoes} ${proposta.visualizacoes === 1 ? 'abertura' : 'aberturas'} · última em ${dataCurta(proposta.ultimaVisualizacaoEm ?? proposta.atualizadoEm)}`,
      acao: 'Acompanhar decisão',
      Icone: Eye,
    };
  }
  if (proposta.status === 'apresentada') {
    return {
      rotulo: 'Aguardando abertura',
      detalhe: proposta.compartilhadaEm
        ? `Compartilhada em ${dataCurta(proposta.compartilhadaEm)}`
        : 'Compartilhe o link com o cliente',
      acao: 'Ver envio',
      Icone: Send,
    };
  }
  if (proposta.status === 'aceita') {
    return {
      rotulo: 'Venda confirmada',
      detalhe: `Decisão em ${dataCurta(proposta.decididaEm ?? proposta.atualizadoEm)}`,
      acao: 'Ver aprovação',
      Icone: Check,
    };
  }
  return {
    rotulo: 'Decisão registrada',
    detalhe: `Não aprovada em ${dataCurta(proposta.decididaEm ?? proposta.atualizadoEm)}`,
    acao: 'Revisar proposta',
    Icone: X,
  };
}

function CardProposta({ proposta }: { proposta: ResumoProposta }) {
  const leitura = leituraDaProposta(proposta);

  return (
    <Link href={`/propostas/${proposta.id}`} className={styles.card} data-status={proposta.status}>
      <div className={styles.cardPrincipal}>
        <div className={styles.cardMeta}>
          <span className={styles.status} data-status={proposta.status}>
            {ROTULO_STATUS_PROPOSTA[proposta.status]}
          </span>
          <p>{proposta.empresa}</p>
        </div>
        <div className={styles.cardTitulo}>
          <h3>{proposta.titulo}</h3>
          <span>{proposta.projeto}</span>
        </div>
      </div>

      <div className={styles.cardValor}>
        <span>Investimento</span>
        <strong>{formatarReais(proposta.valorCentavos)}</strong>
      </div>

      <div className={styles.cardProximoPasso}>
        <span className={styles.cardProximoIcone} aria-hidden="true">
          <leitura.Icone size={16} strokeWidth={1.9} />
        </span>
        <span>
          <strong>{leitura.rotulo}</strong>
          <small>{leitura.detalhe}</small>
        </span>
      </div>

      <span className={styles.cardAcao}>
        {leitura.acao}
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
  const enviadas = propostas.filter((proposta) => proposta.status === 'apresentada');
  const decididas = propostas.filter(foiDecidida);

  const propostasVisiveis = useMemo(() => {
    const termo = normalizarBusca(busca);
    return propostas.filter((proposta) => {
      const noFiltro =
        filtro === 'todas' ||
        (filtro === 'rascunhos' && ehRascunho(proposta)) ||
        (filtro === 'enviadas' && proposta.status === 'apresentada') ||
        (filtro === 'decididas' && foiDecidida(proposta));
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
        : filtro === 'decididas'
          ? 'Nenhuma decisão registrada ainda'
          : 'Nenhuma proposta criada ainda';
  const descricaoVazio = vazioPorBusca
    ? 'Tente buscar pelo nome da empresa, da proposta ou do projeto.'
    : filtro === 'enviadas'
      ? 'As propostas compartilhadas aparecem aqui até o cliente decidir.'
      : filtro === 'decididas'
        ? 'Propostas aceitas ou não aprovadas aparecerão aqui.'
        : 'Crie uma proposta para preparar escopo, prazo e investimento.';

  return (
    <div className={styles.pagina}>
      <CabecalhoOperacional
        titulo="Biblioteca comercial"
        descricao="Crie, envie e acompanhe suas propostas."
        acao={
          propostas.length > 0 ? (
            <Link href="/propostas/nova" className={styles.nova}>
              <Plus size={17} strokeWidth={2} aria-hidden="true" />
              Nova proposta
            </Link>
          ) : undefined
        }
      />

      <section className={styles.arquivo} aria-label="Suas propostas">
        <div className={styles.ferramentas}>
          <AbasFiltro
            abas={[
              { id: 'todas', rotulo: 'Todas', total: propostas.length },
              { id: 'rascunhos', rotulo: 'Rascunhos', total: rascunhos.length },
              { id: 'enviadas', rotulo: 'Enviadas', total: enviadas.length },
              { id: 'decididas', rotulo: 'Decididas', total: decididas.length },
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
            ) : filtro === 'todas' || filtro === 'rascunhos' ? (
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
