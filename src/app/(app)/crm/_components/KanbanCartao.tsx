'use client';

import { useCallback, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { useDraggable } from '@dnd-kit/core';
import {
  Archive,
  ArrowRight,
  Ban,
  CalendarClock,
  CheckCircle2,
  Layers3,
  LoaderCircle,
  XCircle,
} from 'lucide-react';
import { AcoesOportunidade } from './AcoesOportunidade';
import { estaNoFluxo, ROTULO_SITUACAO } from '@/lib/crm/situacao';
import { rotuloMotivoPerda, type EtapaCrm } from '@/lib/crm/etapas';
import { acaoDoPipeline, tituloDoProjetoNoCard } from '@/lib/crm/acao-pipeline';
import type { OportunidadeCrm } from '@/lib/crm/queries';
import styles from './PipelineCrm.module.css';

const FORMATADOR_DATA = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: 'short',
});

const FORMATADOR_MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

export type SolicitarMovimento = (oportunidade: OportunidadeCrm, etapa: EtapaCrm) => void;

function dataCurta(iso: string): string {
  return FORMATADOR_DATA.format(new Date(iso)).replace('.', '');
}

function valorDaOportunidade(valorCentavos: number | null): string | null {
  return valorCentavos === null ? null : FORMATADOR_MOEDA.format(valorCentavos / 100);
}

function prazoDaAcao(iso: string | null): { rotulo: string; vencido: boolean } | null {
  if (!iso) return null;
  const data = new Date(iso);
  const vencido = data.getTime() < Date.now();
  return {
    rotulo: `${vencido ? 'Atrasada desde' : 'Até'} ${dataCurta(iso)}`,
    vencido,
  };
}

function pesquisaDaOportunidade(oportunidade: OportunidadeCrm): {
  estado: 'pendente' | 'processando' | 'pronta' | 'falhou';
  rotulo: string;
} {
  if (
    oportunidade.enriquecimentoStatus === 'na_fila' ||
    oportunidade.enriquecimentoStatus === 'processando'
  ) {
    return { estado: 'processando', rotulo: 'Enriquecendo ficha' };
  }
  if (oportunidade.enriquecimentoStatus === 'concluido' || oportunidade.enriquecidoEm) {
    return { estado: 'pronta', rotulo: 'Ficha enriquecida' };
  }
  if (oportunidade.enriquecimentoStatus === 'falhou') {
    return { estado: 'falhou', rotulo: 'Enriquecimento falhou' };
  }
  return { estado: 'pendente', rotulo: 'Enriquecimento disponível' };
}

function impedirArraste(evento: SyntheticEvent) {
  evento.stopPropagation();
}

export function CartaoOportunidade({
  oportunidade,
  aoMover,
  desabilitado,
}: {
  oportunidade: OportunidadeCrm;
  aoMover: SolicitarMovimento;
  desabilitado: boolean;
}) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, isDragging } = useDraggable({
    id: `card:${oportunidade.id}`,
    data: { oportunidade },
    disabled: desabilitado,
  });
  const definirRef = useCallback(
    (elemento: HTMLElement | null) => {
      setNodeRef(elemento);
      setActivatorNodeRef(elemento);
    },
    [setActivatorNodeRef, setNodeRef],
  );
  const valor = valorDaOportunidade(oportunidade.valorCentavos);
  const prazo = prazoDaAcao(oportunidade.proximaAcaoEm);
  const pesquisa = pesquisaDaOportunidade(oportunidade);
  const acao = acaoDoPipeline(oportunidade);
  const fichaHref = `/vendas/${oportunidade.id}`;

  return (
    <article
      ref={definirRef}
      className={styles.cartao}
      data-arrastando={isDragging || undefined}
      {...attributes}
      {...listeners}
      aria-busy={desabilitado || undefined}
      aria-label={`${oportunidade.titulo}, ${oportunidade.empresa}. Arraste para mudar de etapa.`}
      role="group"
      tabIndex={desabilitado ? -1 : 0}
      data-atencao={!oportunidade.proximaAcao || prazo?.vencido || undefined}
    >
      <div className={styles.cartaoCabecalho}>
        <h3 className={styles.nomeEmpresa}>
          <Link
            href={fichaHref}
            data-no-dnd
            onMouseDown={impedirArraste}
            onTouchStart={impedirArraste}
            onKeyDown={impedirArraste}
          >
            {oportunidade.empresa}
          </Link>
        </h3>
        <AcoesOportunidade
          oportunidade={oportunidade}
          aoMover={aoMover}
          desabilitado={desabilitado}
          compacto
        />
        {desabilitado && (
          <LoaderCircle
            className={styles.salvando}
            size={17}
            strokeWidth={1.8}
            aria-label="Salvando etapa"
          />
        )}
      </div>

      <p className={styles.projetoCartao} title={oportunidade.titulo}>
        {tituloDoProjetoNoCard(oportunidade.titulo, oportunidade.empresa)}
      </p>

      <div className={styles.contextoCartao}>
        <span>{oportunidade.contato ?? 'Contato a definir'}</span>
      </div>
      <div className={styles.metadadosCartao}>
        {valor && <strong>{valor}</strong>}
        <span className={styles.pesquisa} data-estado={pesquisa.estado}>
          <Layers3 size={12} strokeWidth={1.8} aria-hidden="true" />
          {pesquisa.rotulo}
        </span>
      </div>

      <div className={styles.proximoPasso} data-vazio={!oportunidade.proximaAcao || undefined}>
        <span>{oportunidade.proximaAcao ? 'Próximo passo' : 'Último registro'}</span>
        <strong>
          {oportunidade.proximaAcao ??
            oportunidade.ultimoFato ??
            'Defina o primeiro contato com a empresa'}
        </strong>
        {prazo && (
          <small data-vencido={prazo.vencido || undefined}>
            <CalendarClock size={13} strokeWidth={1.9} aria-hidden="true" />
            {prazo.rotulo}
          </small>
        )}
      </div>

      <footer className={styles.rodapeCartao}>
        <div className={styles.acoesCartao}>
          <Link
            href={acao.href}
            className={styles.dossie}
            aria-label={`${acao.rotulo}: ${oportunidade.empresa}`}
            data-no-dnd
            onMouseDown={impedirArraste}
            onTouchStart={impedirArraste}
            onKeyDown={impedirArraste}
          >
            {acao.rotulo}
            <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </footer>
    </article>
  );
}

export function CartaoEncerrado({
  oportunidade,
  aoMover,
  desabilitado,
}: {
  oportunidade: OportunidadeCrm;
  aoMover: SolicitarMovimento;
  desabilitado: boolean;
}) {
  const perdida = oportunidade.etapa === 'perdido';
  const foraDoFluxo = !estaNoFluxo(oportunidade);
  const Icone =
    oportunidade.situacao === 'arquivada'
      ? Archive
      : oportunidade.situacao === 'desclassificada'
        ? Ban
        : perdida
          ? XCircle
          : CheckCircle2;
  const encerradaEm =
    oportunidade.retiradaEm ??
    oportunidade.perdidaEm ??
    oportunidade.ganhaEm ??
    oportunidade.atualizadoEm;
  const valor = valorDaOportunidade(oportunidade.valorCentavos);

  return (
    <article
      className={styles.cartaoEncerrado}
      data-resultado={foraDoFluxo ? 'fora_do_fluxo' : perdida ? 'perdido' : 'ganho'}
    >
      <header>
        <span className={styles.estadoEncerrado}>
          <Icone size={14} strokeWidth={2} aria-hidden="true" />
          {!estaNoFluxo(oportunidade)
            ? ROTULO_SITUACAO[oportunidade.situacao!]
            : perdida
              ? 'Venda perdida'
              : 'Venda ganha'}
        </span>
        <AcoesOportunidade
          compacto
          oportunidade={oportunidade}
          aoMover={aoMover}
          desabilitado={desabilitado}
        />
      </header>
      <div className={styles.encerradoTitulo}>
        <div>
          <span>{oportunidade.empresa}</span>
          <h3 title={oportunidade.titulo}>
            {tituloDoProjetoNoCard(oportunidade.titulo, oportunidade.empresa)}
          </h3>
        </div>
        {valor && <strong>{valor}</strong>}
      </div>
      {perdida && (
        <p className={styles.motivoPerda}>
          <span>Motivo</span>
          <strong>{rotuloMotivoPerda(oportunidade.motivoPerda)}</strong>
        </p>
      )}
      {!estaNoFluxo(oportunidade) && (
        <p className={styles.motivoPerda}>{oportunidade.motivoRetirada}</p>
      )}
      <footer>
        <time dateTime={encerradaEm}>{dataCurta(encerradaEm)}</time>
        <Link href={acaoDoPipeline(oportunidade).href}>
          {acaoDoPipeline(oportunidade).rotulo}
          <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}

export function CartaoOverlay({ oportunidade }: { oportunidade: OportunidadeCrm }) {
  return (
    <div className={styles.overlay}>
      <span>{oportunidade.empresa}</span>
      <strong>{oportunidade.titulo}</strong>
      <small>Solte na etapa desejada</small>
    </div>
  );
}
