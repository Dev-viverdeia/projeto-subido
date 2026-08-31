'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Check, ListChecks, RotateCcw, Video } from 'lucide-react';
import type { EstadoProjetoExecucao } from '@/lib/projetos-execucao/actions';
import { atualizarAcaoPlano } from '@/lib/projetos-execucao/plano-actions';
import type { AcaoPlanoProjeto } from '@/lib/projetos-execucao/queries';
import styles from './PlanoVivo.module.css';

const ESTADO_INICIAL: EstadoProjetoExecucao = {};
const DATA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
});

function ItemPlano({ projetoId, acao }: { projetoId: string; acao: AcaoPlanoProjeto }) {
  const [estado, executar, pendente] = useActionState(atualizarAcaoPlano, ESTADO_INICIAL);
  const concluida = acao.status === 'concluida';

  return (
    <li data-concluida={concluida || undefined}>
      <span className={styles.marcador} aria-hidden="true">
        {concluida ? <Check size={15} /> : null}
      </span>
      <div className={styles.conteudoItem}>
        <strong>{acao.titulo}</strong>
        <div className={styles.metadados}>
          {acao.prazoEm && (
            <time dateTime={acao.prazoEm}>
              <CalendarDays size={13} aria-hidden="true" />
              {DATA.format(new Date(acao.prazoEm))}
            </time>
          )}
          {acao.reuniaoId && (
            <Link href={`/reunioes/${acao.reuniaoId}`}>
              <Video size={13} aria-hidden="true" />
              Ver reunião
              <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          )}
        </div>
        {estado.erro && (
          <small className={styles.erro} role="alert">
            {estado.erro}
          </small>
        )}
        {estado.sucesso && (
          <small className={styles.sucesso} role="status">
            {estado.sucesso}
          </small>
        )}
      </div>
      <form action={executar}>
        <input type="hidden" name="projeto" value={projetoId} />
        <input type="hidden" name="acao" value={acao.id} />
        <button
          type="submit"
          name="status"
          value={concluida ? 'pendente' : 'concluida'}
          disabled={pendente}
        >
          {concluida ? (
            <RotateCcw size={14} aria-hidden="true" />
          ) : (
            <Check size={14} aria-hidden="true" />
          )}
          {concluida ? 'Reabrir' : 'Concluir'}
        </button>
      </form>
    </li>
  );
}

export function PlanoVivo({ projetoId, acoes }: { projetoId: string; acoes: AcaoPlanoProjeto[] }) {
  const compromissos = acoes.filter((acao) => !['acesso', 'dependencia'].includes(acao.categoria));
  if (!compromissos.length) return null;

  const abertas = compromissos.filter((acao) => acao.status === 'pendente').length;
  if (!abertas) return null;

  return (
    <section className={styles.plano} aria-labelledby="plano-vivo-titulo">
      <header>
        <div className={styles.introducao}>
          <span className={styles.icone} aria-hidden="true">
            <ListChecks size={20} strokeWidth={1.7} />
          </span>
          <div>
            <p>Acordos do projeto</p>
            <h2 id="plano-vivo-titulo">Compromissos registrados com o cliente</h2>
          </div>
        </div>
        <div className={styles.medida} aria-label={`${abertas} compromissos em aberto`}>
          <strong>{abertas}</strong>
          <span>{abertas === 1 ? 'em aberto' : 'em aberto'}</span>
        </div>
      </header>

      <p className={styles.explicacao}>
        Decisões confirmadas nas calls ficam aqui. As tarefas de implementação continuam logo
        abaixo, com o critério de conclusão de cada uma.
      </p>

      <ol>
        {compromissos
          .filter((acao) => acao.status === 'pendente')
          .slice(0, 5)
          .map((acao) => (
            <ItemPlano key={acao.id} projetoId={projetoId} acao={acao} />
          ))}
      </ol>
    </section>
  );
}
