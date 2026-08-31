import Link from 'next/link';
import { ArrowUpRight, BadgeCheck, CalendarClock, FileCheck2, History } from 'lucide-react';
import type { ContinuidadePosEntregaDossie } from '@/lib/crm/queries';
import { ROTULO_DECISAO_EVOLUCAO, formatarDataEvolucao } from '@/lib/projetos-execucao/evolucao';
import styles from './ContextoPosEntrega.module.css';

const DATA_LONGA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

export function ContextoPosEntrega({
  continuidade,
}: {
  continuidade: ContinuidadePosEntregaDossie;
}) {
  const expansao = continuidade.decisao === 'expandir';
  const titulo = expansao
    ? 'Este cliente já confirmou valor.'
    : 'O projeto anterior abriu uma nova venda.';
  const abordagem = expansao
    ? 'Retome o resultado confirmado e valide o alcance, o responsável e o prazo da expansão antes de montar outro escopo.'
    : 'Use a entrega anterior como referência de confiança. Depois valide o novo problema, o impacto e quem decide antes de montar outro escopo.';

  return (
    <section className={styles.contexto} aria-labelledby="continuidade-titulo">
      <header className={styles.topo}>
        <div>
          <p className={styles.sobretitulo}>Venda de continuidade</p>
          <h2 id="continuidade-titulo">{titulo}</h2>
          <p>
            Esta oportunidade nasceu da revisão de resultado de uma entrega concluída para o mesmo
            cliente.
          </p>
        </div>
        <span className={styles.estado}>
          <BadgeCheck size={16} strokeWidth={1.9} aria-hidden="true" />
          Base confirmada
        </span>
      </header>

      <div className={styles.corpo}>
        <div className={styles.prova}>
          <div className={styles.rotuloBloco}>
            <FileCheck2 size={17} strokeWidth={1.8} aria-hidden="true" />
            <span>Resultado confirmado</span>
          </div>
          <p className={styles.resultado}>{continuidade.resultadoObservado}</p>

          <dl className={styles.origem}>
            <div>
              <dt>Projeto entregue</dt>
              <dd>{continuidade.projetoTitulo}</dd>
            </div>
            <div>
              <dt>Decisão do cliente</dt>
              <dd>{ROTULO_DECISAO_EVOLUCAO[continuidade.decisao]}</dd>
            </div>
            {continuidade.aceitaEm && (
              <div>
                <dt>Aceite final</dt>
                <dd>{DATA_LONGA.format(new Date(continuidade.aceitaEm)).replace('.', '')}</dd>
              </div>
            )}
          </dl>
        </div>

        <aside className={styles.abordagem} aria-labelledby="abordagem-titulo">
          <div className={styles.rotuloBloco}>
            <History size={17} strokeWidth={1.8} aria-hidden="true" />
            <span>Como abrir a conversa</span>
          </div>
          <h3 id="abordagem-titulo">Comece pelo que já funcionou.</h3>
          <p>{abordagem}</p>

          <div className={styles.proximoPasso}>
            <span>Próximo passo combinado</span>
            <strong>{continuidade.proximoPasso}</strong>
            {continuidade.proximoPassoEm && (
              <time dateTime={continuidade.proximoPassoEm}>
                <CalendarClock size={14} strokeWidth={1.8} aria-hidden="true" />
                {formatarDataEvolucao(continuidade.proximoPassoEm)}
              </time>
            )}
          </div>
        </aside>
      </div>

      <footer className={styles.rodape}>
        <span>
          Resultado registrado em{' '}
          {DATA_LONGA.format(new Date(continuidade.registradaEm)).replace('.', '')}
        </span>
        <nav aria-label="Fontes da venda de continuidade">
          {continuidade.evidenciaResultadoUrl && (
            <a href={continuidade.evidenciaResultadoUrl} target="_blank" rel="noreferrer">
              Abrir resultado
              <ArrowUpRight size={14} strokeWidth={1.9} aria-hidden="true" />
            </a>
          )}
          <Link href={`/entregas/${continuidade.projetoId}`}>
            Revisar entrega
            <ArrowUpRight size={14} strokeWidth={1.9} aria-hidden="true" />
          </Link>
        </nav>
      </footer>
    </section>
  );
}
