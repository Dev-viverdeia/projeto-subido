import Link from 'next/link';
import { ArrowRight, Building2, CircleUserRound, Clock3, Inbox, Layers3 } from 'lucide-react';
import { moverOportunidade } from '@/lib/crm/actions';
import { ETAPAS_CRM, type EtapaCrm } from '@/lib/crm/etapas';
import type { OportunidadeCrm } from '@/lib/crm/queries';
import styles from './PipelineCrm.module.css';

function dataCurta(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(iso));
}

function CartaoOportunidade({ oportunidade }: { oportunidade: OportunidadeCrm }) {
  const analisando =
    oportunidade.enriquecimentoStatus === 'na_fila' ||
    oportunidade.enriquecimentoStatus === 'processando';
  const pronto = oportunidade.enriquecimentoStatus === 'concluido';

  return (
    <article className={styles.cartao}>
      <div className={styles.empresa}>
        <Building2 size={14} strokeWidth={1.8} aria-hidden="true" />
        <span>{oportunidade.empresa}</span>
      </div>

      <h3>{oportunidade.titulo}</h3>

      {oportunidade.contato && (
        <p className={styles.contato}>
          <CircleUserRound size={14} strokeWidth={1.8} aria-hidden="true" />
          <span>{oportunidade.contato}</span>
        </p>
      )}

      <div className={styles.fato}>
        <Clock3 size={13} strokeWidth={1.8} aria-hidden="true" />
        <span>{oportunidade.ultimoFato ?? 'Sem interação registrada'}</span>
        <time dateTime={oportunidade.ultimoFatoEm ?? oportunidade.criadoEm}>
          {dataCurta(oportunidade.ultimoFatoEm ?? oportunidade.criadoEm)}
        </time>
      </div>

      <div className={styles.acoesCartao}>
        <Link
          href={`/crm/${oportunidade.id}`}
          className={styles.dossie}
          data-estado={analisando ? 'analisando' : pronto ? 'pronto' : 'novo'}
        >
          <Layers3 size={14} strokeWidth={1.8} aria-hidden="true" />
          <span>{analisando ? 'Analisando lead' : pronto ? 'Dossiê pronto' : 'Abrir dossiê'}</span>
        </Link>

        <form action={moverOportunidade} className={styles.mover}>
          <input type="hidden" name="id" value={oportunidade.id} />
          <label htmlFor={`etapa-${oportunidade.id}`} className="sr-only">
            Mover {oportunidade.titulo} para
          </label>
          <select id={`etapa-${oportunidade.id}`} name="etapa" defaultValue={oportunidade.etapa}>
            {ETAPAS_CRM.map((etapa) => (
              <option key={etapa.id} value={etapa.id}>
                {etapa.rotulo}
              </option>
            ))}
          </select>
          <button type="submit" aria-label={`Confirmar nova etapa de ${oportunidade.titulo}`}>
            <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
          </button>
        </form>
      </div>
    </article>
  );
}

function Coluna({
  etapa,
  oportunidades,
}: {
  etapa: (typeof ETAPAS_CRM)[number];
  oportunidades: OportunidadeCrm[];
}) {
  return (
    <section className={styles.coluna} data-etapa={etapa.id} aria-labelledby={`coluna-${etapa.id}`}>
      <header className={styles.colunaTopo}>
        <div>
          <h2 id={`coluna-${etapa.id}`}>{etapa.rotulo}</h2>
          <p>{etapa.descricao}</p>
        </div>
        <span className={styles.contador} aria-label={`${oportunidades.length} oportunidades`}>
          {oportunidades.length}
        </span>
      </header>

      <div className={styles.lista}>
        {oportunidades.length ? (
          oportunidades.map((oportunidade) => (
            <CartaoOportunidade key={oportunidade.id} oportunidade={oportunidade} />
          ))
        ) : (
          <div className={styles.vazio}>
            <Inbox size={20} strokeWidth={1.5} aria-hidden="true" />
            <span>Nenhuma oportunidade</span>
          </div>
        )}
      </div>
    </section>
  );
}

export function PipelineCrm({ oportunidades }: { oportunidades: OportunidadeCrm[] }) {
  const porEtapa = new Map<EtapaCrm, OportunidadeCrm[]>();
  for (const etapa of ETAPAS_CRM) porEtapa.set(etapa.id, []);
  for (const oportunidade of oportunidades) porEtapa.get(oportunidade.etapa)?.push(oportunidade);

  return (
    <div
      className={styles.rolagem}
      tabIndex={0}
      aria-label="Pipeline comercial. Role horizontalmente para ver todas as etapas."
    >
      <div className={styles.pipeline}>
        {ETAPAS_CRM.map((etapa) => (
          <Coluna key={etapa.id} etapa={etapa} oportunidades={porEtapa.get(etapa.id) ?? []} />
        ))}
      </div>
    </div>
  );
}
