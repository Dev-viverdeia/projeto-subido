'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Building2, Check, FileSignature, FolderKanban } from 'lucide-react';
import { ROTULO_ETAPA } from '@/lib/crm/etapas';
import { ROTULO_STATUS_PROJETO } from '@/lib/projetos-execucao/status';
import type { ContextoRotaComercialProjeto } from '@/lib/projetos/rota-comercial-modelo';
import { ROTULO_STATUS_PROPOSTA } from '@/lib/propostas/status';
import styles from './ProjetoGuiado.module.css';

function passoAtual(
  oportunidade: ContextoRotaComercialProjeto['oportunidades'][number] | null,
): 1 | 2 | 3 {
  if (oportunidade?.execucao) return 3;
  if (oportunidade?.proposta) return 2;
  return 1;
}

export function RotaComercialProjeto({
  slug,
  titulo,
  contexto,
  destinoNovoLead,
}: {
  slug: string;
  titulo: string;
  contexto: ContextoRotaComercialProjeto;
  destinoNovoLead: string;
}) {
  const [oportunidadeId, setOportunidadeId] = useState(
    contexto.oportunidadeInicialId ?? contexto.oportunidades[0]?.id ?? '',
  );
  const oportunidade = useMemo(
    () => contexto.oportunidades.find((item) => item.id === oportunidadeId) ?? null,
    [contexto.oportunidades, oportunidadeId],
  );
  const atual = passoAtual(oportunidade);

  const destinoPrincipal = oportunidade?.execucao
    ? `/solucoes/execucao/${oportunidade.execucao.id}`
    : oportunidade?.proposta && oportunidade.proposta.status !== 'recusada'
      ? `/propostas/${oportunidade.proposta.id}`
      : oportunidade
        ? `/propostas/nova?oportunidade=${oportunidade.id}&projeto=${encodeURIComponent(slug)}`
        : destinoNovoLead;
  const rotuloPrincipal = oportunidade?.execucao
    ? 'Abrir entrega'
    : oportunidade?.proposta && oportunidade.proposta.status !== 'recusada'
      ? oportunidade.proposta.status === 'aceita'
        ? 'Iniciar entrega'
        : 'Continuar proposta'
      : oportunidade
        ? 'Criar proposta'
        : 'Adicionar empresa';

  return (
    <section className={styles.rotaProjeto} aria-labelledby="rota-projeto-titulo">
      <header>
        <span>Leve ao cliente</span>
        <h2 id="rota-projeto-titulo">Venda este projeto a um cliente.</h2>
        <p>Escolha um cliente em negociação para criar a proposta e acompanhar a entrega.</p>
      </header>

      <ol className={styles.rotaEtapas} aria-label="Fluxo comercial deste Projeto">
        {[
          ['Vendas', 1],
          ['Proposta', 2],
          ['Entrega', 3],
        ].map(([rotulo, numero]) => {
          const indice = Number(numero);
          const concluido = oportunidade ? indice < atual || (indice === 1 && atual === 1) : false;
          const ativo = oportunidade ? indice === atual : indice === 1;
          return (
            <li
              key={rotulo}
              data-concluido={concluido || undefined}
              data-ativo={ativo || undefined}
            >
              <span>{concluido ? <Check size={11} aria-hidden="true" /> : `0${indice}`}</span>
              <strong>{rotulo}</strong>
            </li>
          );
        })}
      </ol>

      {contexto.oportunidades.length ? (
        <div className={styles.rotaContexto}>
          <label htmlFor={`oportunidade-${slug}`}>
            Cliente em negociação
            <select
              id={`oportunidade-${slug}`}
              value={oportunidadeId}
              onChange={(evento) => setOportunidadeId(evento.target.value)}
            >
              {contexto.oportunidades.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.empresa} · {item.titulo}
                </option>
              ))}
            </select>
          </label>

          {oportunidade ? (
            <div className={styles.rotaEstado}>
              <span>
                {oportunidade.execucao ? (
                  <FolderKanban size={15} aria-hidden="true" />
                ) : oportunidade.proposta ? (
                  <FileSignature size={15} aria-hidden="true" />
                ) : (
                  <Building2 size={15} aria-hidden="true" />
                )}
              </span>
              <div>
                <strong>{oportunidade.empresa}</strong>
                <small>
                  {oportunidade.execucao
                    ? ROTULO_STATUS_PROJETO[oportunidade.execucao.status]
                    : oportunidade.proposta
                      ? ROTULO_STATUS_PROPOSTA[oportunidade.proposta.status]
                      : ROTULO_ETAPA[oportunidade.etapa]}
                </small>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className={styles.rotaVazia}>
          <Building2 size={19} strokeWidth={1.7} aria-hidden="true" />
          <div>
            <strong>Comece por uma empresa real.</strong>
            <p>O título de {titulo} já entra na nova venda.</p>
          </div>
        </div>
      )}

      <div className={styles.rotaAcoes}>
        <Link href={destinoPrincipal} className={styles.rotaPrincipal}>
          {rotuloPrincipal}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
        {oportunidade ? (
          <Link href={`/vendas/${oportunidade.id}`} className={styles.rotaSecundaria}>
            Abrir em Vendas
          </Link>
        ) : null}
      </div>

      {oportunidade ? (
        <Link href={destinoNovoLead} className={styles.rotaNovoLead}>
          Usar com outra empresa <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
      ) : null}
    </section>
  );
}
